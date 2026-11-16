import * as https from 'https';
import * as crypto from 'crypto';

export class S3StorageService {
  private bucket: string;
  private region: string;
  private accessKey: string;
  private secretKey: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET_ASSETS || 'bizbox-assets';
    this.region = process.env.S3_REGION || 'ap-south-1';
    this.accessKey = process.env.S3_ACCESS_KEY || '';
    this.secretKey = process.env.S3_SECRET_KEY || '';
  }

  /**
   * Upload a base64 encoded or binary buffer file directly to S3 bizbox-assets bucket
   * returns public HTTPS URL
   */
  async uploadAuditImage(dataUriOrBase64: string, filename?: string): Promise<string> {
    let contentType = 'image/png';
    let buffer: Buffer;

    if (dataUriOrBase64.startsWith('data:')) {
      const match = dataUriOrBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(dataUriOrBase64, 'base64');
      }
    } else {
      buffer = Buffer.from(dataUriOrBase64, 'base64');
    }

    const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : (contentType.includes('webp') ? 'webp' : 'png');
    const safeName = filename || `audit-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const key = `review-proofs/${safeName}`;
    const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;

    if (!this.accessKey || !this.secretKey) {
      // Fallback data URI if S3 keys not present
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    }

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;

    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${hash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = `PUT\n/${key}\n\n${canonicalHeaders}\n${signedHeaders}\n${hash}`;

    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;

    const sign = (secret: string | Buffer, msg: string) => crypto.createHmac('sha256', secret).update(msg).digest();
    const kDate = sign('AWS4' + this.secretKey, dateStamp);
    const kRegion = sign(kDate, this.region);
    const kService = sign(kRegion, 's3');
    const kSigning = sign(kService, 'aws4_request');
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authHeader = `AWS4-HMAC-SHA256 Credential=${this.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return new Promise((resolve, reject) => {
      const req = https.request({
        host,
        path: `/${key}`,
        method: 'PUT',
        headers: {
          'Host': host,
          'Content-Type': contentType,
          'Content-Length': buffer.length,
          'x-amz-date': amzDate,
          'x-amz-content-sha256': hash,
          'Authorization': authHeader
        }
      }, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(`https://${host}/${key}`);
        } else {
          let errBody = '';
          res.on('data', chunk => { errBody += chunk; });
          res.on('end', () => {
            console.error(`S3 upload error: ${res.statusCode} ${errBody}`);
            // Fallback to data URI if S3 PUT fails
            resolve(`data:${contentType};base64,${buffer.toString('base64')}`);
          });
        }
      });

      req.on('error', (err) => {
        console.error('S3 request error:', err);
        // Fallback to data URI
        resolve(`data:${contentType};base64,${buffer.toString('base64')}`);
      });

      req.write(buffer);
      req.end();
    });
  }
}

export const s3StorageService = new S3StorageService();
