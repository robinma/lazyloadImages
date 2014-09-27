/**
 *
 */
(function(root, factory) {

  root.lazyloadimages = factory(root);

})(this, function(root) {
  //is android
  var isAndroid = /android/i.test(root.navigator.userAgent.toLowerCase()),

    dummyStyle = document.createElement('div').style,

    vendor = (function() {
      var vendors = 't webkitT mozT oT msT'.split(' '),
        t,
        ven,
        l = vendors.length;
      for (var i = 0; ven = vendors[i]; i++) {
        t = ven + 'ransform';
        if (t in dummyStyle) {
          return ven.substring(0, ven.length - 1);
        }
      }

    })(),
    //合并属性
    extend = function(target, source) {
      var proprty;
      for (proprty in source) {
        target[proprty] = source[proprty];
      }
      return target;
    },
    proxy = function(fn, scorp) {
      return function() {
        fn.apply(scorp, arguments);
      }
    }

  ;

  function LazyLoadImages(config) {
    config = config || {};
    var o;
    for (o in config) {
      this[o] = config[o];
    }
    this.cx = document.body;

    this._scroll_ = proxy(this._scroll, this);

    root.addEventListener('scroll', this._scroll_, false);
    this.maxScrollY = 0;

    this._onpageshow_ = proxy(this._onpageshow, this);

    this.elements = [];

    root.addEventListener('pageshow', this._onpageshow_, false);
    // root.addEventListener('load',this._onload,false);

  };

  extend(LazyLoadImages.prototype, {
    //图片img src data
    realSrcAttr: 'data-src',
    completedAttr: 'data-load-completed',
    _onpageshow: function(e) {
      if (e.persisted) {
        this.maxScrollY = 0;
        root.scrollTo(0, 0);
      }
    },
    _scroll: function() {
      var scrollY = this.getScrollY();
      if (scrollY > this.maxScrollY) {
        this.maxScrollY = scrollY;
        this._scrollAction();
      }
    },
    _scrollAction: function() {
      console.log('test')
    },
    getScrollY: function() {
      return root.pageYOffset || root.scrollY;
    },
    scan: function(ct) {
      var self = this,
        imgs, tags;
      ct = ct || document.body;
      imgs = ct.querySelectorAll('[' + this.realSrcAttr + ']') || [];
      imgs = Array.prototype.slice(imgs, 0);
      imgs.filter(function(img, index) {
        if (img.getAttribute(self.completedAttr) == 1) {
          return false;
        }
        return true;
      });
      this.elements.concat(imgs);
      this._scrollAction();
    }

  });

  dummyStyle = null;
  return LazyLoadImages;

});