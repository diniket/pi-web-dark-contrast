// Presentation only: no DOM mutation, subscriptions, events, or server module.
// Build stamps the CSS digest here, changing the browser entry and CSS URL on
// every appearance change, even if the host versions entry modules separately.
const stylesheetUrl = path => {
  const url = new URL(path, import.meta.url);
  url.search = new URL(import.meta.url).search;
  url.searchParams.set('dc', '__CSS_REVISION__');
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
