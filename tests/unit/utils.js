import { expect } from 'chai';

import { extract_domain, _, window, document } from '../../src/utils';

describe(`extract_domain`, function() {
  it(`matches simple domain names`, function() {
    expect(extract_domain(`mixpanel.com`)).to.equal(`mixpanel.com`);
    expect(extract_domain(`abc.org`)).to.equal(`abc.org`);
    expect(extract_domain(`superlongdomainnamepartfifteen.net`)).to.equal(`superlongdomainnamepartfifteen.net`);
    expect(extract_domain(`startup.ly`)).to.equal(`startup.ly`);
  });

  it(`extracts domain names from hostnames with subdomains`, function() {
    expect(extract_domain(`mysubdomain.mixpanel.com`)).to.equal(`mixpanel.com`);
    expect(extract_domain(`superfly.startup.ly`)).to.equal(`startup.ly`);
  });

  it(`supports many labels in a single hostname`, function() {
    expect(extract_domain(`my.sub.domain.mixpanel.com`)).to.equal(`mixpanel.com`);
  });

  it(`supports a few common country code second-level domain names (ccSLD)`, function() {
    expect(extract_domain(`www.oxford.ac.uk`)).to.equal(`oxford.ac.uk`);
    expect(extract_domain(`www.dmv.ca.gov`)).to.equal(`dmv.ca.gov`);
    expect(extract_domain(`www.imcc.isa.us`)).to.equal(`imcc.isa.us`);

    // unfortunately can't do a real (sub)domain extraction without a list
    // cases like www.avignon.aeroport.fr will still fail
  });

  it(`supports 2-char domain names in common TLDs`, function() {
    expect(extract_domain(`my.com`)).to.equal(`my.com`);
    expect(extract_domain(`subdomain.my.com`)).to.equal(`my.com`);
    expect(extract_domain(`x.org`)).to.equal(`x.org`);
    expect(extract_domain(`subdomain.x.org`)).to.equal(`x.org`);
  });

  it(`supports long TLDs`, function() {
    expect(extract_domain(`supercool.company`)).to.equal(`supercool.company`);
    expect(extract_domain(`sub.supercool.company`)).to.equal(`supercool.company`);
  });
});

describe(`_.info helper methods`, function() {
  beforeEach(resetTestingState);
  afterEach(resetTestingState);
  function resetTestingState() {
    // reset util module window and document state before and after each test run
    var location = {
      hostname: ``
    };
    window.location = location;
    document.URL = ``;
    document.location = location;
    document.referrer = ``;
    document.title = ``;
  }

  describe(`_.info.campaignParams`, function() {
    it(`matches UTM source if present`, function() {
      document.URL = `https://www.example.com/?utm_source=google`;
      expect(_.info.campaignParams().utm_source).to.equal(`google`);
    });

    it(`does not match UTM source if not present`, function() {
      document.URL = `https://www.example.com/?utm_medium=email`;
      expect(_.info.campaignParams().utm_source).to.be.undefined;
    });

    it(`matches UTM medium if present`, function() {
      document.URL = `https://www.example.com/?utm_medium=email`;
      expect(_.info.campaignParams()).to.contain({utm_medium: `email`});
    });

    it(`does not match UTM medium if empty`, function() {
      document.URL = `https://www.example.com/?utm_medium=&utm_source=bing`;
      expect(_.info.campaignParams().utm_medium).to.be.undefined;
    });

    it(`matches partial UTM parameters if present`, function() {
      document.URL = `https://www.example.com/?utm_medium=email&utm_source=bing&utm_campaign=summer-sale`;
      var campaignParams = _.info.campaignParams();
      expect(campaignParams.utm_source).to.equal(`bing`);
      expect(campaignParams.utm_medium).to.equal(`email`);
      expect(campaignParams.utm_campaign).to.equal(`summer-sale`);
      expect(campaignParams.utm_content).to.be.undefined;
      expect(campaignParams.utm_term).to.be.undefined;
    });

    it(`matches all five UTM parameters if present`, function() {
      document.URL = `https://www.example.com/?utm_medium=email&utm_source=bing&utm_term=analysis,product&utm_campaign=summer-sale&utm_content=april-blog`;
      var campaignParams = _.info.campaignParams();
      expect(campaignParams.utm_source).to.equal(`bing`);
      expect(campaignParams.utm_medium).to.equal(`email`);
      expect(campaignParams.utm_campaign).to.equal(`summer-sale`);
      expect(campaignParams.utm_content).to.equal(`april-blog`);
      expect(campaignParams.utm_term).to.equal(`analysis,product`);
    });

    it(`accepts a default value for absent UTM parameters`, function() {
      document.URL = `https://www.example.com/?utm_source=bing&utm_term=analysis,product&utm_campaign=summer-sale`;
      var campaignParams = _.info.campaignParams(null);
      expect(campaignParams.utm_source).to.equal(`bing`);
      expect(campaignParams.utm_campaign).to.equal(`summer-sale`);
      expect(campaignParams.utm_term).to.equal(`analysis,product`);
      expect(campaignParams.utm_medium).to.be.null;
      expect(campaignParams.utm_content).to.be.null;
    });
  });

  describe(`_.info.clickParams`, function() {
    it(`matches on single gclid if present`, function() {
      // note it would be very unlikely for more than one click ID to be present on a URL
      document.URL = `https://www.example.com/?gclid=some-gclid`;
      var clickParams = _.info.clickParams();
      expect(clickParams.gclid).to.equal(`some-gclid`);

      expect(clickParams.dclid).to.be.undefined;
      expect(clickParams.fbclid).to.be.undefined;
      expect(clickParams.ko_click_id).to.be.undefined;
      expect(clickParams.li_fat_id).to.be.undefined;
      expect(clickParams.msclkid).to.be.undefined;
      expect(clickParams.ttclid).to.be.undefined;
      expect(clickParams.twclid).to.be.undefined;
      expect(clickParams.wbraid).to.be.undefined;
    });

    it(`matches on all click IDs if present`, function() {
      // note it would be very unlikely for more than one click ID to be present on a URL
      document.URL = `https://www.example.com/?dclid=a&fbclid=b&gclid=c&ko_click_id=d&li_fat_id=e&msclkid=f&ttclid=g&twclid=h&wbraid=i`;
      var clickParams = _.info.clickParams();
      expect(clickParams.dclid).to.equal(`a`);
      expect(clickParams.fbclid).to.equal(`b`);
      expect(clickParams.gclid).to.equal(`c`);
      expect(clickParams.ko_click_id).to.equal(`d`);
      expect(clickParams.li_fat_id).to.equal(`e`);
      expect(clickParams.msclkid).to.equal(`f`);
      expect(clickParams.ttclid).to.equal(`g`);
      expect(clickParams.twclid).to.equal(`h`);
      expect(clickParams.wbraid).to.equal(`i`);
    });

    it(`does not match on click IDs if not present`, function() {
      // note it would be very unlikely for more than one click ID to be present on a URL
      document.URL = `https://www.example.com/?utm_source=google`;
      var clickParams = _.info.clickParams();
      expect(clickParams.dclid).to.be.undefined;
      expect(clickParams.fbclid).to.be.undefined;
      expect(clickParams.gclid).to.be.undefined;
      expect(clickParams.ko_click_id).to.be.undefined;
      expect(clickParams.li_fat_id).to.be.undefined;
      expect(clickParams.msclkid).to.be.undefined;
      expect(clickParams.ttclid).to.be.undefined;
      expect(clickParams.twclid).to.be.undefined;
      expect(clickParams.wbraid).to.be.undefined;
    });
  });

  describe(`_.info.marketingParams`, function() {
    it(`matches on both UTM params and click IDs if present`, function() {
      // note it would be very unlikely for more than one click ID to be present on a URL
      document.URL = `https://www.example.com/?utm_source=google&gclid=some-gclid`;
      var marketingParams = _.info.marketingParams();
      expect(marketingParams.utm_source).to.equal(`google`)

      expect(marketingParams.utm_campaign).to.be.undefined;
      expect(marketingParams.utm_term).to.be.undefined;
      expect(marketingParams.utm_medium).to.be.undefined;
      expect(marketingParams.utm_content).to.be.undefined;

      expect(marketingParams.gclid).to.equal(`some-gclid`);

      expect(marketingParams.dclid).to.be.undefined;
      expect(marketingParams.fbclid).to.be.undefined;
      expect(marketingParams.ko_click_id).to.be.undefined;
      expect(marketingParams.li_fat_id).to.be.undefined;
      expect(marketingParams.msclkid).to.be.undefined;
      expect(marketingParams.ttclid).to.be.undefined;
      expect(marketingParams.twclid).to.be.undefined;
      expect(marketingParams.wbraid).to.be.undefined;
    });
  });

  describe(`_.info.mpPageViewProperties`, function() {
    it(`pulls page view properties from window and document`, function() {
      document.title = `Pricing - Mixpanel`;
      document.URL = `https://www.example.com/pricing?utm_source=google`
      window.location = {
        hostname: `www.example.com`,
        pathname: `/pricing`,
        protocol: `https`,
        search: `?utm_source=google`
      };

      var pageViewProperties = _.info.mpPageViewProperties();

      expect(pageViewProperties.current_page_title).to.equal(`Pricing - Mixpanel`);
      expect(pageViewProperties.current_domain).to.equal(`www.example.com`);
      expect(pageViewProperties.current_url_path).to.equal(`/pricing`);
      expect(pageViewProperties.current_url_protocol).to.equal(`https`);
      expect(pageViewProperties.current_url_search).to.equal(`?utm_source=google`);
    });
  });
});

describe('_.isBlockedUA', function() {
  [
    'Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)',
    'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
    'Mozilla/5.0 (compatible; AhrefsSiteAudit/6.1; +http://ahrefs.com/robot/site-audit)', // Desktop
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.128 Mobile Safari/537.36 (compatible; AhrefsSiteAudit/6.1; +http://ahrefs.com/robot/site-audit)', // Mobile
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 (Windows Phone 8.1; ARM; Trident/7.0; Touch; rv:11.0; IEMobile/11.0; NOKIA; Lumia 530) like Gecko (compatible; adidxbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/534+ (KHTML, like Gecko) BingPreview/1.0b',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
    'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'facebookexternalhit/1.1',
    'Mozilla/5.0 (compatible;PetalBot;+http://aspiegel.com/petalbot)',
    'Mozilla/5.0(Linux;Android7.0;) AppleWebKit/537.36(KHTML,likeGecko) MobileSafari/537.36(compatible;PetalBot;+http://aspiegel.com/petalbot)',
    'Mozilla/5.0 (compatible; Pinterestbot/1.0; +http://www.pinterest.com/bot.html)',
    'APIs-Google (+https://developers.google.com/webmasters/APIs-Google.html)',
    'Mediapartners-Google',
    'Mozilla/5.0 (Linux; Android 5.0; SM-G920A) AppleWebKit (KHTML, like Gecko) Chrome Mobile Safari (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)',
    'FeedFetcher-Google; (+http://www.google.com/feedfetcher.html)',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36 (compatible; Google-Read-Aloud; +/search/docs/advanced/crawling/overview-google-crawlers)',
    'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012; DuplexWeb-Google/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Mobile Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.75 Safari/537.36 Google Favicon',
    'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 5 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko; googleweblight) Chrome/38.0.1025.166 Mobile Safari/535.19',
    'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012; Storebot-Google/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36',
    'Screaming Frog SEO Spider/12.3',
    'Mozilla/5.0 (Linux; Android 7.0; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4695.0 Mobile Safari/537.36 Chrome-Lighthouse',
  ].forEach((ua) => {
    it(`should block bot user agent: ${ua}`, () => {
      expect(_.isBlockedUA(ua)).to.be.true;
    });
  });
});
