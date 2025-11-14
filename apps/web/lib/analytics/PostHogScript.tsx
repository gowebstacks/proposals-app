'use client';

import { useEffect, useRef } from 'react';
import './types';

const PostHogScript = () => {
  const scriptAppended = useRef(false);

  useEffect(() => {
    if (!scriptAppended.current) {
      // Create a script element for PostHog initialization
      const postHogScript = document.createElement('script');
      postHogScript.type = 'text/javascript';
      postHogScript.innerHTML = `
        !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      `;

      document.head.appendChild(postHogScript);

      // Connect PostHog with Segment when analytics is ready
      const connectScript = document.createElement('script');
      connectScript.type = 'text/javascript';
      connectScript.innerHTML = `
        if (window.analytics) {
          window.analytics.ready(() => {
            window.posthog.init('phc_i8rHCcdBr6FyBH1VW3HZEfFdBYMg1VFpuEAFhJe8DzI', {
              api_host: 'https://us.i.posthog.com',
              segment: window.analytics,
              capture_pageview: false,
              capture_pageleave: true,
              session_recording: {
                maskAllInputs: false,
                maskInputOptions: {
                  password: true,
                },
              },
              loaded: (posthog) => {
                // When the posthog library has loaded, analytics.page() will be called by Segment
              }
            });
          });
        } else {
          // If analytics isn't loaded yet, wait for it
          const checkAnalytics = setInterval(() => {
            if (window.analytics) {
              window.analytics.ready(() => {
                window.posthog.init('phc_OQ6zFSyrmeCt3lEaINACprDqLk7ZJkJobqeFbx0dkaC', {
                  api_host: 'https://us.i.posthog.com',
                  segment: window.analytics,
                  capture_pageview: false,
                  capture_pageleave: true,
                  session_recording: {
                    maskAllInputs: false,
                    maskInputOptions: {
                      password: true,
                    },
                  },
                  loaded: (posthog) => {
                    // When the posthog library has loaded, analytics.page() will be called by Segment
                  }
                });
              });
              clearInterval(checkAnalytics);
            }
          }, 100);
        }
      `;
      document.head.appendChild(connectScript);

      scriptAppended.current = true;

      return () => {
        document.head.removeChild(postHogScript);
        document.head.removeChild(connectScript);
        scriptAppended.current = false;
      };
    }
  }, []);

  return null;
};

export default PostHogScript;
