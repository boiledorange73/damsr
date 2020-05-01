(function(global) {
  // KMLの空間参照系
  var proj4326 = new OpenLayers.Projection("EPSG:4326");

  if( global["MAIN"] == null ) {
    global["MAIN"] = {};
  }
  var M = global["MAIN"];


  // 地域移動
  var regions = [
    {"value":  1, "text": "北海道", "box": [138, 41, 149, 46]},
    {"value":  2, "text": "東北北部", "box": [139,38,142.5,42]},
    {"value":  3, "text": "東北南部・新潟", "box": [137, 36.5, 142, 39]},
    {"value":  4, "text": "関東", "box": [138, 34.5, 141, 37.5]},
    {"value":  5, "text": "北陸・長野", "box": [135.4, 35, 138.8, 37.5]},
    {"value":  6, "text": "東海", "box": [135.9, 33.7, 139.2, 36]},
    {"value":  7, "text": "近畿", "box": [134.2, 33.4, 136.8, 35.8]},
    {"value":  8, "text": "中国四国", "box": [130.8, 32.7, 134.6, 35.7]},
    {"value":  9, "text": "九州", "box": [128.5, 30.0, 132.2, 34.8]},
    {"value": 10, "text": "沖縄", "box": [125.7, 25, 130.0, 28]},
    {"value": "", "text": "-- 地域選択 --", "default": true},
    {"value":  0, "text": "全国", "box": [122, 23, 149, 46]},
  ];
  var default_region_value = 0;

  // レイヤ選択
  var layers = [
    {"value": "FF", "text": "表示しない"},
    {"value": "FT", "text": "欠測等非表示", "default": true},
    {"value": "TF", "text": "全て表示"},
  ];

  // KMLレイヤ
  var kmlsettings = [
    {
      "name": "ダム貯水率",
      "url": "http://aginfo.cgk.affrc.go.jp/data/kml/damsr.kml"
    },
    {
      "name": "ダム貯水(欠測等非表示)",
      "url": "http://aginfo.cgk.affrc.go.jp/data/kml/damsrlim.kml"
    }
  ];

  var balls = [
    {"type": "w", "text": "欠測等"},
    {"type": "r", "text": "-50%"},
    {"type": "y", "text": "-80%"},
    {"type": "b", "text": "80%-"}
  ];

  // SELECT要素にOPTION要素を追加するための関数
  function makeOptions(e, list) {
    var dv = null; // default value
    for( var n = 0; n < list.length; n++ ) {
      var one = list[n];
      if( one != null ) {
        var v = one["value"];
        // updates dv if dv is null
        if( dv == null ) {
          if( one["default"] == true ) {
            dv = v;
          }
        }
        var opt = document.createElement("option");
        opt.setAttribute("value", v);
        opt.appendChild(document.createTextNode(one["text"]));
        e.appendChild(opt);
      }
    }
    if( dv != null ) {
      e.value = dv;
    }
  }

  // エリア選択select要素が変更された際に呼ばれる
  function onRegionChange(map, e_regions, value) {
    var llBox = null;
    for( var n = 0; llBox == null && n < regions.length; n++ ) {
      var r = regions[n];
      if( r["value"] == value ) {
        llBox = r["box"];
      }
    }
    if( llBox != null ) {
      var box = OpenLayers.Bounds.fromArray(llBox).
        transform(proj4326, map.projection);
      map.zoomToExtent(box, false);
    }
    // 戻す
    e_regions.value = "";
  }

  // レイヤ選択select要素が変更された際に呼ばれる
  function onLayerChange(map, kmls, e_layers, value) {
    if( value == null ) {
      // default value
      for(var n = 0; value == null && n < layers.length; n++ ) {
        if( layers[n] != null && layers[n]["default"] == true ) {
          // found default
          value = layers[n].value;
        }
      }
      if( value == null ) {
        return;
      }
    }
    var ix = -1;
    var changes = []; // 0-維持 -1-消す 1-表示する
    var newvalue = "";
    for( var n = 0; n < kmls.length; n++ ) {
      var vnow = kmls[n].getVisibility(); // 現状
      var vnew = false; // 変更後
      if( ix < 0 ) {
        if( value.charAt(n) == 'T' ) {
          // shows this layer
          vnew = true;
          ix = n;
        }
      }
      newvalue = newvalue + (vnew ? "T" : "F");
      changes[n] = vnew == vnow ? 0 : (vnew ? 1 : -1);
      // changes
      if( changes[n] == -1 ) {
        kmls[n].setVisibility(false);
      }
      else if( changes[n] == 1 ) {
        kmls[n].setVisibility(true);
      }
    }
    // resets value
    e_layers.value = newvalue;
  }

  //
  // Initialization (external)
  //
  M.init = function() {
    // TOPを作る
    var top = document.getElementById("TOP");
    // TOP / p1
    var e_p1 = document.createElement("p");
    top.appendChild(e_p1);
    e_p1.appendChild(document.createTextNode("出典: "));
    var e_p1_a = document.createElement("a");
    e_p1.appendChild(e_p1_a);
    e_p1_a.href = "http://www.river.go.jp/";
    e_p1_a.target = "_blank";
    e_p1_a.appendChild(document.createTextNode("国土交通省【川の防災情報】"));
    // TOP / p1 / finds
    e_p1.appendChild(document.createTextNode(" / "));
    e_p1.appendChild(document.createTextNode("加工: "));
    var e_p1_a2 = document.createElement("a");
    e_p1.appendChild(e_p1_a2);
    e_p1_a2.href = "http://aginfo.cgk.affrc.go.jp/dam/";
    e_p1_a2.target = "_blank";
    e_p1_a2.appendChild(document.createTextNode("農研機構 http://aginfo.cgk.affrc.go.jp/dam/"));
    // TOP / p2
    var e_p2 = document.createElement("p");
    top.appendChild(e_p2);
    for( var n = 0; n < balls.length; n++ ) {
      if( balls[n] != null ) {
        var e_span = document.createElement("span");
        e_p2.appendChild(e_span);
        e_span.className = "ball";
        var e_img = document.createElement("img");
        e_span.appendChild(e_img);
        e_img.width = "16";
        e_img.height = "16";
        e_img.src = "http://aginfo.cgk.affrc.go.jp/data/kml/c16x16" +
          balls[n]["type"] + ".gif";
        e_span.appendChild(document.createTextNode(": "+balls[n]["text"]));
      }
    }
    // p2/layers
    var e_layers = document.createElement("select");
    e_p2.appendChild(e_layers);
    makeOptions(e_layers, layers);
    // p2/regions
    var e_regions = document.createElement("select");
    e_p2.appendChild(e_regions);
    makeOptions(e_regions, regions);
    // p2/plink
    var e_plink_wrap = document.createElement("span");
    e_plink_wrap.className = "plink";
    e_p2.appendChild(e_plink_wrap);
    var e_plink = document.createElement("a");
    e_plink_wrap.appendChild(e_plink);
    e_plink.target = "_blank";
    e_plink.href = "javascript:void(0)";
    e_plink.appendChild(document.createTextNode("永続リンク"));

    // コントロール生成
    var controls = [];
    controls.push(new OpenLayers.Control.Attribution());
    var ismobile  = BO.G.ua.mobile;
    if( ismobile ) {
      controls.push(new OpenLayers.Control.TouchNavigation());
      // ZOOM Panel will be set after all.
    }
    else {
      controls.push(new OpenLayers.Control.Navigation());
      controls.push(new OpenLayers.Control.PanZoomBar());
    }
    // zoom panel
    var e_mz = document.getElementById("MOBILEZOOM");
    if( ismobile ) {
      var e_in = document.createElement("div");
      e_in.appendChild(document.createTextNode("+"));
      e_in.onclick = function() {
        if( map != null ) {
          map.zoomIn();
        }
      }
      var e_out = document.createElement("div");
      e_out.appendChild(document.createTextNode("-"));
      e_out.onclick = function() {
        if( map != null ) {
          map.zoomOut();
        }
      }
      e_mz.appendChild(e_in);
      e_mz.appendChild(e_out);
    }
    else {
      e_mz.style.display = "none";
    }
    // makes map
    var options = {
      "projection": new OpenLayers.Projection("EPSG:900913"),
      "maxResolution":156543.0339,
      "maxExtent": new OpenLayers.Bounds(
        -20037508.3427892,-20037508.3427892,20037508.3427892,20037508.3427892
      ),
      "units": "m",
      "controls": controls,
      "numZoomLevels": 18,
      "displayProjection": proj4326
    };

    var map = new OpenLayers.Map('MAIN',options);
    map.div.style.backgroundColor = 'rgb(221,238,255)';

    var pnwms = new OpenLayers.Layer.TMS(
      "地名",
      "http://aginfo.cgk.affrc.go.jp/ws/tmc/",
      {
        layername: 'pntms-900913',
        type: 'png',
        attribution: '<a target=\"_blank\" href="http://aginfo.cgk.affrc.go.jp/mapprv/index.html.ja">地図画像配信サービス</a>',
        isBaseLayer: false
      },
      {
        isBaseLayer: false
      }
    );
    var kibanwms = new OpenLayers.Layer.TMS(
      "KIBAN 25000 TMS",
      "http://aginfo.cgk.affrc.go.jp/ws/tmc/",
      {
        layername: "KBN25000ANF-900913",
        type: "png",
        attribution: '<a target=\"_blank\" href="http://aginfo.cgk.affrc.go.jp/mapprv/index.html.ja">地図画像配信サービス</a>',
        isBaseLayer: true
      }
    );
    map.addLayers([kibanwms,pnwms]);
    // KML
    var kmls = [];
    var selfeats = []
    for(var n = 0; n < kmlsettings.length; n++ ) {
      var ks = kmlsettings[n];
      var kmllayer = new OpenLayers.Layer.Vector(
        ks.name,
        {
          "projection": proj4326,
          "strategies": [new OpenLayers.Strategy.Fixed()],
          "protocol": new OpenLayers.Protocol.HTTP({
            "url": ks.url,
            "format": new OpenLayers.Format.KML({
              "extractStyles": true,
              "extractAttributes": true
            })
          }),
          "visibility": false
        }
      );
      map.addLayer(kmllayer);
      // フィーチャー選択コントロール
      var selfeat = new OpenLayers.Control.SelectFeature(kmllayer);
      map.addControl(selfeat);
      selfeat.activate();   
      kmllayer.events.on({
        "featureselected": function(event) {
          var feature = event.feature;
          var content = "<h2>"+ feature.attributes.name + "</h2>" +
            feature.attributes.description;
          if(content.search("<script") >= 0 ) {
            content = content.replace(/</g, "&lt;");
          }
          var popup = new OpenLayers.Popup.FramedCloud(
            "damrscloud", 
            feature.geometry.getBounds().getCenterLonLat(),
            new OpenLayers.Size(255,250),
            content,
            null,
            true,
            function(evt){
              // called when popup closed
              for(var n = 0; n < selfeats.length; n++ ) {
                selfeats[n].unselectAll();
              }
            }
          );
          popup.autoSize = false;
          feature.popup = popup;
          map.addPopup(popup);
        },
        "featureunselected": function(event) {
          if( event.feature && event.feature.popup ) {
            map.removePopup(event.feature.popup);
            event.feature.popup.destroy();
            delete event.feature.popup;
          }
        }
      });
      kmls.push(kmllayer);
      selfeats.push(selfeat);
    }
    // Permalink
    var url_plink = new BO.Url(BO.G.url.body());
    var updateLink = function() {
      var center = map.getCenter();
      if( center != null ) {
        // lon, lat
        var p =  OpenLayers.Projection.transform(
          {"x": center.lon, "y": center.lat},
          map.getProjectionObject(),
          map.displayProjection
        );
        url_plink.param("lon", Math.round(p.x*100000)/100000);
        url_plink.param("lat", Math.round(p.y*100000)/100000);
        url_plink.param("zoom", map.getZoom());
      }
      // KML
      var fin = false;
      var l = "";
      for( var n = 0; n < kmls.length; n++ ) {
        if( !fin ) {
          if( kmls[n] != null && kmls[n].getVisibility() == true ) {
            l = l + "T";
            fin = true;
          }
          else {
            l = l + "F";
          }
        }
        else {
          l = l + "F";
        }
      }
      url_plink.param("l", l);
      e_plink.href = url_plink.toString();
    }
    map.events.on({
      'moveend': updateLink,
      'changelayer': updateLink,
      'changebaselayer': updateLink
    });
    // layersのイベント
    e_layers.onchange = function() {
      onLayerChange(map, kmls, e_layers, e_layers.value);
    };
    // regionsのイベント
    // regions / events
    e_regions.onchange = function() {
      onRegionChange(map, e_regions, e_regions.value);
    };
    // リサイズイベントを捕まえる
    var onresize;
    if( BO.G.ua.isIE8OrLess() ) {
      // IE 7 or less does not have window.innerHeight.
      onresize = function() {
        var h1 = document.getElementById("TOP").offsetHeight;
        var wh = document.documentElement.offsetHeight;
        document.getElementById("MAIN").style.height = (wh - h1) + "px";
      };
    }
    else {
      onresize = function() {
        var h1 = document.getElementById("TOP").offsetHeight;
        var wh = window.innerHeight;
        document.getElementById("MAIN").style.height = (wh - h1) + "px";
      };
    }
    OpenLayers.Event.observe(window, 'resize', onresize);
    onresize();
    // 初期表示範囲設定
    if(!map.getCenter()) {
      var lat = BO.G.url.param("lat");
      var lon = BO.G.url.param("lon");
      var zoom = BO.G.url.param("zoom");
      if( lat != null && lon != null && zoom != null ) {
        var p= OpenLayers.Projection.transform(
            {"x": lon*1.0, "y": lat*1.0},
            map.displayProjection,
            map.getProjectionObject()
          );
        map.setCenter(
          [p.x, p.y],
          zoom
        );
      }
      else {
        onRegionChange(map,e_regions,default_region_value);
      }
    }
    // レイヤ初期化
    var l = BO.G.url.param("l");
    onLayerChange(map, kmls, e_layers, l);
  };
})((this || 0).self || global);

window.onload = MAIN.init;
