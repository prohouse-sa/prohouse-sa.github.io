/* Pro House — progressive enhancement and privacy-safe first-party event tracking.
   The page remains fully readable and usable with JavaScript disabled. */
(function () {
  'use strict';

  /* --- Meta Pixel ------------------------------------------------------ */
  var META_PIXEL_ID = '522459347054271';
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');

  /* --- mobile nav ------------------------------------------------------ */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- header shadow once scrolled ------------------------------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- campaign attribution -------------------------------------------- */
  var trackedParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
  var params = new URLSearchParams(window.location.search);
  var campaign = {};
  trackedParams.forEach(function (key) {
    var value = params.get(key);
    if (value) campaign[key] = value;
  });
  if (Object.keys(campaign).length) {
    try { sessionStorage.setItem('prohouse_campaign_context', JSON.stringify(campaign)); } catch (e) { /* storage is optional */ }
  } else {
    try { campaign = JSON.parse(sessionStorage.getItem('prohouse_campaign_context') || '{}'); } catch (e) { campaign = {}; }
  }

  function sendEvent(name, values) {
    var payload = Object.assign({}, values || {});
    payload.page_path = window.location.pathname;
    payload.utm_source = campaign.utm_source || '(direct)';
    payload.utm_medium = campaign.utm_medium || '(none)';
    payload.utm_campaign = campaign.utm_campaign || '(not set)';
    payload.utm_term = campaign.utm_term || '(not set)';

    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload);
    }

    if (typeof window.fbq !== 'function') return;
    if (name === 'generate_lead') {
      window.fbq('track', 'Lead', payload);
    } else if (name === 'contact') {
      window.fbq('track', 'Contact', payload);
    } else if (name === 'view_promotion') {
      window.fbq('track', 'ViewContent', payload);
    } else if (name === 'select_promotion') {
      window.fbq('trackCustom', 'SelectPromotion', payload);
    } else if (name === 'get_directions') {
      window.fbq('trackCustom', 'GetDirections', payload);
    } else if (name === 'app_store_click') {
      window.fbq('trackCustom', 'AppStoreClick', payload);
    }
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a');
    if (!link) return;

    var href = link.getAttribute('href') || '';
    var explicit = link.getAttribute('data-track');
    var text = (link.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100);
    var common = { link_url: href, link_text: text };

    if (explicit === 'trial_offer_whatsapp') {
      sendEvent('generate_lead', Object.assign({
        lead_source: 'trial_offer_whatsapp',
        offer_name: '3_chicken_meals_65',
        content_name: '3_chicken_meals_65',
        value: 65,
        currency: 'SAR'
      }, common));
    } else if (explicit && explicit.indexOf('trial_offer_') === 0) {
      sendEvent('select_promotion', Object.assign({
        promotion_id: 'trial_3_chicken_65',
        promotion_name: '3_chicken_meals_65',
        creative_slot: explicit,
        items: [{ item_id: 'trial_3_chicken_65', item_name: '3 وجبات دجاج بـ65 ريال' }]
      }, common));
    } else if (href.indexOf('app.techrar.com/prohouse') !== -1) {
      sendEvent('generate_lead', Object.assign({
        lead_source: 'subscription_store',
        content_name: 'meal_subscription'
      }, common));
    } else if (href.indexOf('wa.me/') !== -1 || href.indexOf('iwtsp.com/') !== -1) {
      sendEvent('contact', Object.assign({ contact_method: 'whatsapp' }, common));
    } else if (href.indexOf('tel:') === 0) {
      sendEvent('contact', Object.assign({ contact_method: 'phone' }, common));
    } else if (href.indexOf('g.co/') !== -1 || href.indexOf('share.google/') !== -1 || href.indexOf('maps.google') !== -1) {
      sendEvent('get_directions', common);
    } else if (href.indexOf('apps.apple.com/') !== -1 || href.indexOf('play.google.com/') !== -1) {
      sendEvent('app_store_click', common);
    }
  }, { passive: true });

  /* --- promotion visibility -------------------------------------------- */
  var promotion = document.querySelector('[data-promotion-id="trial_3_chicken_65"]');
  if (promotion && 'IntersectionObserver' in window) {
    var promotionSeen = false;
    var promotionObserver = new IntersectionObserver(function (entries) {
      if (!promotionSeen && entries[0] && entries[0].isIntersecting) {
        promotionSeen = true;
        sendEvent('view_promotion', {
          promotion_id: 'trial_3_chicken_65',
          promotion_name: '3_chicken_meals_65',
          content_name: '3_chicken_meals_65',
          content_type: 'product',
          value: 65,
          currency: 'SAR',
          items: [{ item_id: 'trial_3_chicken_65', item_name: '3 وجبات دجاج بـ65 ريال' }]
        });
        promotionObserver.disconnect();
      }
    }, { threshold: 0.35 });
    promotionObserver.observe(promotion);
  }

  /* --- scroll reveal ---------------------------------------------------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }
})();

/* current year in the footer */
document.addEventListener('DOMContentLoaded', function () {
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});
