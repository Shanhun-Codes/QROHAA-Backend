import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

@Injectable()
export class InvitationEmailService {
  constructor(private readonly config: ConfigService) {}
  async send(
    email: string,
    agencyName: string,
    token: string,
    expiresAt: Date,
  ) {
    const origin = this.config.get<string>('AGENT_PORTAL_URL');
    const from = this.config.get<string>('INVITATION_EMAIL_FROM');
    const link = origin
      ? `${origin.replace(/\/$/, '')}/join-agency#invite=${encodeURIComponent(token)}`
      : null;
    if (!link || !from) return { delivery: 'MANUAL' as const, link };
    try {
      const client = new SESv2Client({
        region: this.config.getOrThrow<string>('AWS_REGION'),
      });
      await client.send(
        new SendEmailCommand({
          FromEmailAddress: from,
          Destination: { ToAddresses: [email] },
          Content: {
            Simple: {
              Subject: { Data: `Invitation to join ${agencyName}` },
              Body: {
                Text: {
                  Data: `You have been invited to join ${agencyName}.\n\nSign in or create an account using ${email}, then review and accept your invitation:\n${link}\n\nThis link expires at ${expiresAt.toISOString()}. Your agency will manage your branding and brokerage details; your headshot remains yours. If you did not expect this invitation, ignore it.`,
                },
              },
            },
          },
        }),
      );
      return { delivery: 'SENT' as const, link };
    } catch {
      // Keep the invitation usable; never expose AWS errors or the token in logs.
      return { delivery: 'FAILED' as const, link };
    }
  }
}
