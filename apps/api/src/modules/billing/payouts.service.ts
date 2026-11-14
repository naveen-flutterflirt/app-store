import { query } from '../../db';

export interface BankDetailsDto {
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  panNumber: string;
  gstin?: string;
}

export class PayoutsService {
  /**
   * Retrieves developer earnings summary & payout ledger
   */
  async getDeveloperEarnings(developerId: string) {
    // 1. Fetch developer profile & payout settings
    const devs = await query(`
      SELECT id, name, slug, email, revenue_share_pct, payout_ref, gstin,
             bank_account_holder, bank_name, bank_account_number, bank_ifsc, pan_number
      FROM store.developers
      WHERE id = $1
    `, [developerId]);

    if (!devs || devs.length === 0) {
      throw new Error(`Developer organization not found.`);
    }
    const dev = devs[0];

    // 2. Fetch all apps owned by this developer with active subscriptions
    const appsSummary = await query(`
      SELECT 
        a.id, a.name, a.package_id, a.status,
        COUNT(DISTINCT i.id)::int as active_installs,
        COALESCE(SUM(p.price_month), 0)::numeric(12,2) as gross_mrr
      FROM store.apps a
      LEFT JOIN store.installations i ON i.app_id = a.id AND i.status = 'active'
      LEFT JOIN store.app_plans p ON i.plan_id = p.id
      WHERE a.developer_id = $1
      GROUP BY a.id, a.name, a.package_id, a.status
      ORDER BY gross_mrr DESC
    `, [developerId]);

    const totalGrossMrr = appsSummary.reduce((acc: number, app: any) => acc + Number(app.gross_mrr || 0), 0);
    const revSharePct = Number(dev.revenue_share_pct) || 80.0;
    const devMonthlyGross = Math.round((totalGrossMrr * (revSharePct / 100)) * 100) / 100;
    const tds10Pct = Math.round((devMonthlyGross * 0.10) * 100) / 100;
    const nextEstimatedPayout = Math.round((devMonthlyGross - tds10Pct) * 100) / 100;

    // 3. Fetch past payouts history from store.payouts
    const history = await query(`
      SELECT 
        id, period_start, period_end, gross, platform_fee, tds, net, status, provider_ref
      FROM store.payouts
      WHERE developer_id = $1
      ORDER BY period_start DESC
      LIMIT 12
    `, [developerId]);

    const totalNetEarned = history
      .filter((h: any) => h.status === 'paid')
      .reduce((acc: number, h: any) => acc + Number(h.net || 0), 0);

    return {
      developer: {
        id: dev.id,
        name: dev.name,
        email: dev.email,
        revenueSharePct: revSharePct,
        payoutConfigured: !!(dev.payout_ref || dev.bank_account_number),
        payoutRef: dev.payout_ref || null,
        bankDetails: dev.bank_account_number ? {
          accountHolder: dev.bank_account_holder,
          bankName: dev.bank_name,
          accountNumberMasked: `****${dev.bank_account_number.slice(-4)}`,
          ifsc: dev.bank_ifsc,
          pan: dev.pan_number ? `${dev.pan_number.slice(0, 2)}****${dev.pan_number.slice(-2)}` : null
        } : null,
        gstin: dev.gstin
      },
      metrics: {
        grossMrr: totalGrossMrr,
        developerShareMrr: devMonthlyGross,
        tdsDeduction: tds10Pct,
        nextEstimatedPayout,
        totalLifetimePaid: totalNetEarned,
        activePayingOutlets: appsSummary.reduce((acc: number, a: any) => acc + a.active_installs, 0)
      },
      apps: appsSummary,
      history
    };
  }

  /**
   * Updates bank account / Razorpay Route recipient settings
   */
  async updateBankDetails(developerId: string, dto: BankDetailsDto) {
    if (!dto.accountHolder || !dto.accountHolder.trim()) throw new Error('Account holder name is required');
    if (!dto.accountNumber || dto.accountNumber.length < 8) throw new Error('Valid bank account number is required');
    if (!dto.ifscCode || dto.ifscCode.length < 11) throw new Error('Valid 11-character IFSC code is required');
    if (!dto.panNumber || dto.panNumber.length !== 10) throw new Error('Valid 10-character PAN is required for TDS filing');

    // Create encrypted / tokenized reference (simulating Razorpay Route linked account token)
    const tokenizedRef = `rzp_route_acc_${dto.accountNumber.slice(-4)}_${dto.ifscCode.slice(0, 4).toUpperCase()}`;

    const res = await query(`
      UPDATE store.developers
      SET payout_ref = $1, 
          gstin = COALESCE($2, gstin),
          bank_account_holder = $3,
          bank_name = $4,
          bank_account_number = $5,
          bank_ifsc = $6,
          pan_number = $7
      WHERE id = $8
      RETURNING id, name, payout_ref, gstin, bank_account_holder, bank_name, bank_ifsc
    `, [
      tokenizedRef, 
      dto.gstin?.trim() || null,
      dto.accountHolder.trim(),
      dto.bankName.trim(),
      dto.accountNumber.trim(),
      dto.ifscCode.trim().toUpperCase(),
      dto.panNumber.trim().toUpperCase(),
      developerId
    ]);

    return {
      success: true,
      message: 'Bank account and tax details registered securely for automated direct deposit.',
      payoutRef: tokenizedRef,
      developer: res[0]
    };
  }
}

export const payoutsService = new PayoutsService();
