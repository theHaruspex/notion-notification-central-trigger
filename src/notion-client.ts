import { Client } from '@notionhq/client';
import { GLOBAL_RPS, NOTION_API_KEY, TOKEN_BUCKET_CAPACITY } from './config';
import { TokenBucket } from './utils/token-bucket';

/**
 * Thin rate-limited wrapper around the Notion SDK.
 *
 * We only expose what this project actually needs.
 */
class NotionRateLimitedClient {
  private readonly client: Client;
  private readonly bucket: TokenBucket;

  constructor() {
    this.client = new Client({ auth: NOTION_API_KEY });
    this.bucket = new TokenBucket(TOKEN_BUCKET_CAPACITY, GLOBAL_RPS);
  }

  private async throttle(): Promise<void> {
    await this.bucket.acquire();
  }

  // We accept a loose `any` here to avoid depending on internal SDK type paths.
  async queryDatabase(params: any) {
    await this.throttle();
    return this.client.databases.query(params);
  }

  async updatePage(params: any) {
    await this.throttle();
    return this.client.pages.update(params);
  }
}

export const notion = new NotionRateLimitedClient();


