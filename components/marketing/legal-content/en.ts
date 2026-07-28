import type { LegalDocs } from "./types";
import { LEGAL_CONTACT as C } from "./types";

const UPDATED = "28 July 2026";

export const legal: LegalDocs = {
  privacy: {
    metaTitle: "Privacy Policy | Zap Bridge",
    metaDescription:
      "How Zap Bridge collects, uses, and protects your information, and the rights you have over your personal data.",
    title: "Privacy Policy",
    subtitle: "How we collect, use, and protect your information.",
    updated: UPDATED,
    sections: [
      {
        id: "overview",
        title: "1. Overview",
        paragraphs: [
          "This Privacy Policy explains how Zap Bridge (“we”, “us”, “the Service”, provided via zapbridge.tech and related subdomains) collects, uses, stores, and protects your information. The Service is operated independently by an individual developer.",
          `By using the Service you confirm that you have read and understood this Policy. If you do not agree with it, please stop using the Service. If you have any questions about this Policy, you can contact us at ${C}.`,
        ],
      },
      {
        id: "collect",
        title: "2. Information we collect",
        paragraphs: ["To provide and improve the Service, we may collect the following categories of information:"],
        bullets: [
          "Account information: the email address, display name, and avatar obtained when you sign in through a third-party account such as Google.",
          "Content you create: the landing page configurations and copy you produce in the Service, the images you upload or select, the custom domains you connect, and similar material.",
          "Visitor data captured through your landing pages: pages you publish may capture a visitor's name, email, phone number, or message. For this data you are the data controller, and we act solely as your data processor, storing and transmitting it on your behalf.",
          "Usage and technical data: access logs, IP address, device and browser type, and statistics on page visits and conversions.",
          "Payment information: paid plans are handled by a third-party payment provider acting as Merchant of Record. We neither access nor store your full card details.",
          "Cookies and similar technologies: used to maintain your signed-in session, save preferences, and carry out usage analytics.",
        ],
      },
      {
        id: "use",
        title: "3. How we use information",
        bullets: [
          "To provide, maintain, and improve the features and experience of the Service;",
          "To create and manage your account and authenticate you;",
          "To process plan subscriptions, billing, and related notifications;",
          "To keep the Service secure and to prevent and investigate fraud and abuse;",
          "To communicate with you where necessary about service changes, security matters, and important notices;",
          "To comply with applicable legal obligations.",
        ],
      },
      {
        id: "third-parties",
        title: "4. Third-party services and sub-processors",
        paragraphs: [
          "To operate the Service we use a number of third-party providers, which may process relevant data within the scope of the services they provide to us. These include authentication services, cloud hosting and databases, payment providers, stock image services, and the artificial intelligence services used to generate landing page content.",
          "Separately, you may configure third-party tracking pixels (such as Meta, TikTok, and Google) on your own landing pages. Data processing by those third parties is governed by their respective privacy policies; enabling them is your decision, and you are responsible for using them compliantly.",
        ],
      },
      {
        id: "roles",
        title: "5. Roles regarding landing pages and visitor data",
        paragraphs: [
          "For the personal data of visitors captured through your landing pages, you are the data controller and we are the data processor, storing and making that data available solely on your instructions.",
          "You are responsible for ensuring you have a lawful basis for capturing visitor data, and for providing the necessary privacy notices and consent mechanisms to visitors on your own landing pages. You remain responsible for the compliance of your landing page content and your data processing.",
        ],
      },
      {
        id: "retention",
        title: "6. Data retention",
        paragraphs: [
          "We retain your information for as long as your account exists and for as long as necessary to fulfil the purposes described in this Policy. After you close your account we will delete or anonymise the relevant data within a reasonable period, except where the law requires us to retain it.",
        ],
      },
      {
        id: "security",
        title: "7. Data security",
        paragraphs: [
          "We apply reasonable technical and organisational measures to protect your information against unauthorised access, use, or disclosure. Please note, however, that no method of transmission over the internet or of electronic storage can be guaranteed to be absolutely secure.",
        ],
      },
      {
        id: "rights",
        title: "8. Your rights",
        paragraphs: [
          `To the extent permitted by applicable law, you have the right to access, correct, delete, or export your personal data, and to withdraw consent you have previously given. You can contact us at ${C} to exercise these rights, and we will respond within a reasonable period.`,
        ],
      },
      {
        id: "transfers",
        title: "9. International data transfers",
        paragraphs: [
          "The Service is offered to users worldwide, and your information may be stored and processed in different countries or regions. By using the Service you understand and agree to such cross-border transfers.",
        ],
      },
      {
        id: "cookies",
        title: "10. Cookies",
        paragraphs: [
          "We use necessary cookies to maintain the basic functionality of the Service (such as your sign-in session), and analytics cookies to understand how the Service is used. You can manage or clear cookies through your browser settings, though doing so may affect how some features work.",
        ],
      },
      {
        id: "children",
        title: "11. Minors",
        paragraphs: [
          "The Service is not directed at anyone under the age of 16. We do not knowingly collect personal data from minors; if you believe we may hold such data, please contact us promptly so we can delete it.",
        ],
      },
      {
        id: "changes",
        title: "12. Changes to this Policy",
        paragraphs: [
          "We may update this Privacy Policy from time to time. Updates will be published on this page with a revised “last updated” date, and where the changes are material we will notify you by appropriate means.",
        ],
      },
      {
        id: "language",
        title: "13. Language",
        paragraphs: [
          "This Policy is published in English and Simplified Chinese. The English version is the authoritative text: in the event of any discrepancy or inconsistency between the two versions, the English version prevails.",
        ],
      },
      {
        id: "contact",
        title: "14. Contact us",
        paragraphs: [
          `If you have any questions about this Privacy Policy or about how personal data is handled, please contact us by email at ${C}.`,
        ],
      },
    ],
  },

  terms: {
    metaTitle: "Terms of Service | Zap Bridge",
    metaDescription:
      "The terms and conditions for using Zap Bridge, covering accounts, billing, acceptable use, and limitation of liability.",
    title: "Terms of Service",
    subtitle: "The terms and conditions for using Zap Bridge.",
    updated: UPDATED,
    sections: [
      {
        id: "acceptance",
        title: "1. Acceptance of these terms",
        paragraphs: [
          "These Terms of Service (the “Terms”) form the agreement between you and Zap Bridge (“we”, “us”, “the Service”) regarding your use of the Service. By accessing or using the Service you agree to be bound by these Terms; if you do not agree, please do not use the Service.",
        ],
      },
      {
        id: "service",
        title: "2. Description of the Service",
        paragraphs: [
          "Zap Bridge provides tools for creating, hosting, and configuring tracking on landing pages for overseas lead generation, helping users produce marketing landing pages for inquiries and lead capture. The Service is operated independently by an individual developer.",
          "We may add to, modify, or discontinue features from time to time. Where changes are material, we will notify you by appropriate means.",
        ],
      },
      {
        id: "accounts",
        title: "3. Accounts and eligibility",
        paragraphs: [
          "You must provide true and accurate information to create an account, you are responsible for all activity that occurs under it, and you must keep your sign-in credentials secure. You confirm that you have reached the age of legal capacity required to enter into these Terms in your jurisdiction.",
        ],
      },
      {
        id: "billing",
        title: "4. Plans, billing, and renewals",
        bullets: [
          "The Service offers free and paid plans. Paid plans are handled by a third-party payment provider acting as Merchant of Record, which processes collection, invoicing, and the associated taxes on our behalf.",
          "Subscription plans renew automatically for the billing period you selected until you cancel. After cancellation your plan is downgraded at the end of the period already paid for, and amounts already paid are not refunded, except where mandatory law provides otherwise.",
          "One-time purchases (such as credit top-up packs) are non-refundable once delivered, except where mandatory law provides otherwise.",
          "We may adjust plan pricing, and will give you advance notice by appropriate means before an adjustment takes effect for you.",
        ],
      },
      {
        id: "acceptable-use",
        title: "5. Acceptable use",
        paragraphs: ["When using the Service, you agree not to:"],
        bullets: [
          "Use the Service for any unlawful, fraudulent, infringing, or misleading purpose;",
          "Publish or promote content that violates the policies of the advertising platforms you use;",
          "Use the Service to circumvent content review in order to distribute unlawful or harmful information.",
        ],
      },
      {
        id: "anti-ban",
        title: "6. Regarding the anti-duplication feature",
        paragraphs: [
          "The Service's anti-duplication feature is intended to scatter the structural fingerprint of same-template pages for legitimate advertisers, lowering the odds of a false positive from similarity detection. It operates while keeping page content identical, and is not cloaking or any other form of deception that hides real content from reviewers or users. You must not use this feature for the purpose of deceiving review in order to evade compliance requirements.",
        ],
      },
      {
        id: "user-content",
        title: "7. User content and responsibility",
        paragraphs: [
          "You retain ownership of the content you create through the Service. You are responsible for the legality and accuracy of that content and for the compliance of any visitor data captured through your landing pages, and you warrant that you have obtained the necessary rights to use the material involved.",
          "In order to provide the Service to you, you grant us a limited, non-exclusive licence to store, display, reproduce, and process your content, strictly to the extent necessary to operate and provide the Service.",
        ],
      },
      {
        id: "ip",
        title: "8. Intellectual property",
        paragraphs: [
          "Intellectual property rights in the Service itself and in its associated software, interfaces, trademarks, and content (excluding your user content) belong to the operator of the Service. You may not copy, modify, distribute, or otherwise exploit that material without permission.",
        ],
      },
      {
        id: "third-parties",
        title: "9. Third-party services",
        paragraphs: [
          "The Service may integrate with, or allow you to connect to, third-party services (such as tracking pixels, domain services, and payment providers). Those third-party services are governed by their own terms and policies, and we are not responsible for their conduct or availability.",
        ],
      },
      {
        id: "disclaimer",
        title: "10. Disclaimer",
        paragraphs: [
          "The Service is provided on an “as is” and “as available” basis. To the maximum extent permitted by applicable law, we make no warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and uninterrupted or error-free operation.",
        ],
      },
      {
        id: "liability",
        title: "11. Limitation of liability",
        paragraphs: [
          "To the maximum extent permitted by applicable law, we are not liable for any indirect, incidental, special, or consequential loss arising from your use of, or inability to use, the Service. In no event shall our aggregate liability exceed the amounts you actually paid us for the Service during a reasonable period before the event giving rise to the liability.",
        ],
      },
      {
        id: "termination",
        title: "12. Termination",
        paragraphs: [
          "You may stop using the Service and close your account at any time. If you breach these Terms, we may suspend or terminate your access to the Service. Following termination, those provisions of these Terms that by their nature should survive will remain in effect.",
        ],
      },
      {
        id: "changes",
        title: "13. Changes to these Terms",
        paragraphs: [
          "We may update these Terms from time to time. Updates will be published on this page with a revised “last updated” date. Your continued use of the Service after the changes take effect constitutes acceptance of the revised Terms.",
        ],
      },
      {
        id: "law",
        title: "14. Governing law and disputes",
        paragraphs: [
          "These Terms are interpreted and enforced in accordance with applicable law. Any dispute between the parties arising from the Service should first be resolved through good-faith negotiation. These Terms do not designate a specific exclusive jurisdiction.",
        ],
      },
      {
        id: "language",
        title: "15. Language",
        paragraphs: [
          "These Terms are published in English and Simplified Chinese. The English version is the authoritative text: in the event of any discrepancy or inconsistency between the two versions, the English version prevails.",
        ],
      },
      {
        id: "contact",
        title: "16. Contact us",
        paragraphs: [`If you have any questions about these Terms, please contact us by email at ${C}.`],
      },
    ],
  },
};
