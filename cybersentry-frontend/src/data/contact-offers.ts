export type ContactOfferId = 'general' | 'starter' | 'growth' | 'enterprise';

export type ContactOfferOption = {
  value: ContactOfferId;
  label: string;
  description: string;
};

export const contactOfferOptions: ContactOfferOption[] = [
  {
    value: 'general',
    label: 'General sales inquiry',
    description: 'Talk through pricing, onboarding, or the best fit for your team.',
  },
  {
    value: 'starter',
    label: 'Starter plan inquiry',
    description: 'Request access for a smaller team or a first deployment.',
  },
  {
    value: 'growth',
    label: 'Growth plan inquiry',
    description: 'Request a shared workspace and broader investigation coverage.',
  },
  {
    value: 'enterprise',
    label: 'Enterprise plan inquiry',
    description: 'Request private workflows, priority support, or a custom rollout.',
  },
];

export const defaultContactOffer: ContactOfferId = 'general';

export const isContactOfferId = (value: string | null | undefined): value is ContactOfferId =>
  contactOfferOptions.some((option) => option.value === value);

export const resolveContactOffer = (...candidates: Array<string | null | undefined>): ContactOfferId => {
  const match = candidates.find(isContactOfferId);
  return match ?? defaultContactOffer;
};

export const buildContactTarget = (offer: ContactOfferId, source: string) =>
  `/contact?offer=${encodeURIComponent(offer)}&source=${encodeURIComponent(source)}`;

void contactOfferOptions;
void defaultContactOffer;
void isContactOfferId;
void resolveContactOffer;
void buildContactTarget;



