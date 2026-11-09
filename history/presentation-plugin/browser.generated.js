// Presentation only: no DOM mutation, subscriptions, events, or server module.
// Build stamps the CSS digest here, changing the browser entry and CSS URL on
// every appearance change, even if the host versions entry modules separately.
const stylesheetUrl = path => {
  const url = new URL(path, import.meta.url);
  url.search = new URL(import.meta.url).search;
  url.searchParams.set('dc', 'fa957b9237b1ccf81e1298653b88dbdcc0cfb697a3b1f4331ea48f373669c5de');
  return url.href;
};
export default {
  apiVersion: 5,
  name: 'Dark Contrast',
  activate: () => ({
    contributions: {
      stylesheets: [
        { id: 'appearance', url: stylesheetUrl('./appearance.css'), order: 2000 },
      ],
    },
  }),
};
