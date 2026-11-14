import { query } from '../src/db';

export class AdminPayoutsService {
  /**
   * Retrieves live pending settlement balance & all developer bank accounts
   */
  async getPayoutOverview() {
    // 1. Fetch each developer with bank details and unpaid earnings
    const devs = await query(`
      SELECT 
        d.id, d.name, d.email, d.revenue_share_pct, d.payout_ref,
        d.bank_account_holder, d.bank_name, d.bank_account_number, d.bank_ifsc, d.pan_number, d.gstin,
        COUNT(DISTINCT a.id)::int as total_apps,
        COUNT(DISTINCT i.id)::int as active_subscribers,
        COALESCE(SUM(p.price_month), 0)::numeric(12,2) as gross_mrr
      FROM store.developers d
      LEFT JOIN store.apps a ON a.developer_id = d.id
      LEFT JOIN store.installations i ON i.app_id = a.id AND i.status = 'active'
      LEFT JOIN store.app_plans p ON i.plan_id = p.id
      WHERE d.type <> 'first_party'
      GROUP BY d.id, d.name, d.email, d.revenue_share_pct, d.payout_ref,
               d.bank_account_holder, d.bank_name, d.bank_account_number, d.bank_ifsc, d.pan_number, d.gstin
      ORDER BY gross_mrr DESC
    `);

    // 2. Fetch all historical payouts from store.payouts
    const history = await query(`
      SELECT 
        p.id, p.developer_id, p.period_start, p.period_end, p.gross, p.platform_fee, p.tds, p.net, p.status, p.provider_ref,
        d.name as developer_name, d.email as developer_email, d.bank_name, d.bank_ifsc, d.bank_account_number
      FROM store.payouts p
      JOIN store.developers d ON p.developer_id = d.id
      ORDER BY p.period_start DESC
      LIMIT 50
    `);

    // Calculate totals
    const developerLedger = devs.map((d: any) => {
      const gross = Number(d.gross_mrr || 0);
      const revPct = Number(d.revenue_share_pct) || 80.0;
      const devShare = Math.round((gross * (revPct / 100)) * 100) / 100;
      const platformFee = Math.round((gross * ((100 - revPct) / 100)) * 100) / 100;
      const tds = Math.round((devShare * 0.10) * 100) / 100;
      const netPayable = Math.round((devShare - tds) * 100) / 100;

      return {
        developerId: d.id,
        name: d.name,
        email: d.email,
        revenueSharePct: revPct,
        bankConfigured: !!(d.bank_account_number || d.payout_ref),
        bank: d.bank_account_number ? {
          accountHolder: d.bank_account_holder,
          bankName: d.bank_name,
          accountNumber: `****${d.bank_account_number.slice(-4)}`,
          fullAccountNumber: d.bank_account_number,
          ifsc: d.bank_ifsc,
          pan: d.pan_number,
          gstin: d.gstin
        } : null,
        payoutRef: d.payout_ref,
        grossRevenue: gross,
        platformFee,
        devShare,
        tdsWithheld: tds,
        netPayable,
        activeSubscribers: d.active_subscribers
      };
    });

    const totalGross = developerLedger.reduce((acc: number, d: any) => acc + d.grossRevenue, 0);
    const totalPlatformProfit = developerLedger.reduce((acc: number, d: any) => acc + d.platformFee, 0);
    const totalTdsAccumulated = developerLedger.reduce((acc: number, d: any) => acc + d.tdsWithheld, 0);
    const totalNetPayableToDevs = developerLedger.reduce((acc: number, d: any) => acc + d.netPayable, 0);

    return {
      summary: {
        totalGrossMrr: totalGross,
        platformProfit: totalPlatformProfit,
        tdsWithheld: totalTdsAccumulated,
        netPayableToDevelopers: totalNetPayableToDevs,
        totalPartners: devs.length,
        readyForPayoutCount: developerLedger.filter((d: any) => d.bankConfigured && d.netPayable > 0).length
      },
      developers: developerLedger,
      history
    };
  }

  /**
   * Admin pays single developer directly
   */
  async payDeveloper(developerId: string, amount?: number) {
    const devs = await query(`
      SELECT id, name, email, revenue_share_pct, payout_ref, bank_account_number, bank_ifsc
      FROM store.developers
      WHERE id = $1
    `, [developerId]);

    if (!devs || devs.length === 0) throw new Error('Developer not found');
    const dev = devs[0];

    if (!dev.bank_account_number && !dev.payout_ref) {
      throw new Error(`Developer ${dev.name} has not linked their bank account or IFSC code yet.`);
    }

    // Calculate pending gross
    const mrr = await query(`
      SELECT COALESCE(SUM(p.price_month), 0)::numeric(12,2) as gross
      FROM store.apps a
      JOIN store.installations i ON i.app_id = a.id AND i.status = 'active'
      JOIN store.app_plans p ON i.plan_id = p.id
      WHERE a.developer_id = $1
    `, [developerId]);

    const gross = amount || Number(mrr[0].gross);
    if (gross <= 0) {
      throw new Error(`Developer has ₹0 pending balance to settle.`);
    }

    const revSharePct = Number(dev.revenue_share_pct) || 80.0;
    const platformFee = Math.round((gross * ((100 - revSharePct) / 100)) * 100) / 100;
    const devShare = Math.round((gross * (revSharePct / 100)) * 100) / 100;
    const tds = Math.round((devShare * 0.10) * 100) / 100;
    const net = Math.round((devShare - tds) * 100) / 100;

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const providerRef = `NEFT_${dev.bank_ifsc?.slice(0, 4) || 'RZP'}_${Date.now().toString().slice(-8)}`;

    const res = await query(`
      INSERT INTO store.payouts (
        developer_id, period_start, period_end, gross, platform_fee, tds, net, status, provider_ref
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'paid', $8)
      ON CONFLICT (developer_id, period_start)
      DO UPDATE SET gross = EXCLUDED.gross, platform_fee = EXCLUDED.platform_fee, 
                    tds = EXCLUDED.tds, net = EXCLUDED.net, status = 'paid', provider_ref = EXCLUDED.provider_ref
      RETURNING *
    `, [
      developerId,
      periodStart,
      periodEnd,
      gross,
      platformFee,
      tds,
      net,
      providerRef
    ]);

    return {
      success: true,
      message: `Direct bank transfer of ₹${net.toLocaleString()} initiated to ${dev.name} via ${providerRef}`,
      payout: res[0]
    };
  }
}

export const adminPayoutsService = new AdminPayoutsService();
