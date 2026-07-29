export const siteConfig = {
  orgName: 'Leaving Egypt',
  tagline: 'Freedom · Brotherhood · Purpose',
  shortMission:
    'A Christ-centered brotherhood helping men leave what holds them back and step into the life God designed.',
  footerMission:
    'A Christ-centered brotherhood helping men leave what holds them back and step into the life God designed — growing together in Faith, Family, Fitness, and Finance.',
  domain: 'https://leavingegypt.example.com',
  formEmail: 'sunbirdsrvresortvillage@gmail.com',
  social: {
    instagram: '#SOCIAL-LINK-PLACEHOLDER',
    facebook: '#SOCIAL-LINK-PLACEHOLDER',
    youtube: '#SOCIAL-LINK-PLACEHOLDER',
  },
} as const;

export const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/pillars', label: 'The Four Pillars' },
  { href: '/programs', label: 'Brotherhood' },
  { href: '/resources', label: 'Resources' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
] as const;
