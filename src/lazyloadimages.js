/**
 *图片延迟加载 for mobile
 */
(function(root, factory) {
    //set up formFilter appropriately for the enviroment.
  if (typeof define === 'function' && (define.cmd || define.amd)) {
    define(function() {
      return factory(root);
    });
  } else {
    //as a browser global
    root.lazyloadimages = factory(root);
  }

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
    transitionEndEvent = (function() {
      if (vendor == 'webkit' || vendor === 'O') {
        return vendor.toLowerCase() + 'TransitionEnd';
      }
      return 'transitionend';
    }()),
    listenTransition = function(target, duration, callbackFn) {
      var me = this,
        clear = function() {
          if (target.transitionTimer) clearTimeout(target.transitionTimer);
          target.transitionTimer = null;
          target.removeEventListener(transitionEndEvent, handler, false);
        },
        handler = function() {
          clear();
          if (callbackFn) callbackFn.call(me);
        };
      clear();
      target.addEventListener(transitionEndEvent, handler, false);
      target.transitionTimer = setTimeout(handler, duration + 100);
    },
    //合并属性
    extend = function(target, source) {
      var proprty;
      for (proprty in source) {
        target[proprty] = source[proprty];
      }
      return target;
    },
    proxy = function(fn, scorp, ext) {
      return function() {
        var narg = ext ? Array.prototype.concat.call(arguments, ext) : arguments;
        fn.apply(scorp, narg);
      }
    }

  ;

  function LazyLoadImages(config) {
    config = config || {};
    var o;
    for (o in config) {
      this[o] = config[o];
    }
    this.ct = document.body;

    this._scroll_ = proxy(this._scroll, this);

    if (isAndroid) {
      this.useFade = false;
    }

    root.addEventListener('scroll', this._scroll_, false);
    this.maxScrollY = 0;

    this._onpageshow_ = proxy(this._onpageshow, this);

    this.elements = [];
    this.lazyElements = {};

    root.addEventListener('pageshow', this._onpageshow_, false);
    // root.addEventListener('load',this._onload,false);
    this.scan(this.ct);
  };

  extend(LazyLoadImages.prototype, {
    //图片img src data
    realSrcAttr: 'data-src',
    completedAttr: 'data-load-completed',
    range: 200,
    useFade: true,
    _onpageshow: function(e) {
      if (e.persisted) {
        this.maxScrollY = 0;
        root.scrollTo(0, 0);
      }
    },
    getScrollY: function() {
      return root.pageYOffset || root.scrollY;
    },
    _scroll: function() {
      var scrollY = this.getScrollY();
      if (scrollY > this.maxScrollY) {
        this.maxScrollY = scrollY;
        this._scrollAction();
      }
    },
    _scrollAction: function() {
      clearTimeout(this.lazyLoadTimeout);
      this.elements = this.elements.filter(function(img) {

        if ((this.range + window.innerHeight) >= (img.getBoundingClientRect().top + document.documentElement.clientTop)) {
          var realSrc = img.getAttribute(this.realSrcAttr);
          if (realSrc) {
            if (this.lazyElements[realSrc]) {
              this.lazyElements[realSrc].push(img);
            } else {
              this.lazyElements[realSrc] = [img];
            }
          }
          return false;
        }
        return true;
      }, this);
      this.lazyLoadTimeout = setTimeout(proxy(this._loadImage, this), isAndroid ? 200 : 0);
    },
    _loadImage: function() {
      var vimg, realSrc, vimgs;
      for (realSrc in this.lazyElements) {
        vimgs = this.lazyElements[realSrc];
        vimg = vimgs.shift();
        if (vimgs.length == 0)
          delete this.lazyElements[realSrc];
        if (vimg.nodeName.toLowerCase() == 'img' && vimg.nodeType == 1) {
          vimg.addEventListener('load', proxy(this._onImgLoad, this), false);
          if (vimg.src != realSrc) {
            this._setImgSrc(vimg, realSrc);
          } else {
            this._onImgLoad(vimg);
          }
        } else if (vimg.nodeType == 1) {
          //img为div,span时
          var img = new Image;
          img.setAttribute(this.realSrcAttr, vimg.getAttribute(this.realSrcAttr));

          img.addEventListener('load', proxy(this._onImgLoad, this, vimg), false);
          if (img.src != realSrc) {
            this._setImgSrc(img, realSrc);
          } else {

          }

        } else {
          continue;
        }
      }
    },
    _onImgLoad: function(e, vimg) {
      var self = this,
        img = vimg || e.target || e,
        realSrc = img.getAttribute(this.realSrcAttr),
        imgs = self.lazyElements[realSrc];

      self._showImage(img);
      if (imgs) {
        imgs.forEach(function(i) {
          if (i.nodeName.toLowerCase() == 'img' && i.nodeType == 1) {
            self._setImgSrc(i, realSrc, img);
          }
          self._showImage(i);

        });
        delete self.lazyElements[realSrc];
      }
    },
    _setImgSrc: function(img, realSrc) {

      if (this.useFade) {
        img.style.opacity = "0";
      }
      img.src = realSrc;
    },
    //设置背景图
    _setImgBackground: function(img, realSrc) {
      if (img) {
        img.style.backgroundImage = 'url(' + realSrc + ')';
      }
    },
    _showImage: function(img) {
      var me = this,
        cb = function() {
          img.setAttribute(me.completedAttr, '1');
        };
      if (img.nodeName.toLowerCase() != 'img') {
        this._setImgBackground(img, img.getAttribute(this.realSrcAttr));
        cb();
      };
      if (me.useFade) {
        img.style[vendor + 'Transition'] = 'opacity 600ms';
        img.style.opacity = 1;
        listenTransition(img, 200, cb);
      } else {
        cb();
      }
    },
    scan: function(ct) {
      var imgs, tags;
      ct = ct || document.body;
      imgs = ct.querySelectorAll('[' + this.realSrcAttr + ']') || [];
      imgs = Array.prototype.slice.call(imgs, 0);
      imgs.filter(function(img, index) {
        if (img.getAttribute(this.completedAttr) == 1) {
          return false;
        }
        return true;
      }, this);
      this.elements = this.elements.concat(imgs);
      this._scrollAction();
    }

  });

  dummyStyle = null;
  return LazyLoadImages;

});