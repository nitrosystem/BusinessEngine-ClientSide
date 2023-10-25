$scope.Form.State = "open";
$scope.Form.Fillter = "close";
const map = L.map("map", {});

window["map"] = map;

var isRendered;

var osmLayer = new L.TileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    minZoom: 1,
    maxZoom: 18,
    attribution:
      'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  }
);

var layer = map.addLayer(osmLayer);
map.zoomControl.setPosition("bottomright");

L.control
  .locate({
    position: "bottomright",
    strings: {
      title: "نمایش موقعیت من روی نقشه",
    },
  })
  .addTo(map);

var position = { lat: 35.8418326, lng: 52.2623352 };

map.setView([position.lat, position.lng], 5);

map.on("zoom", function (e) {
  processPoints(false, false);
});

drawPoints(0, "Country");
drawPoints(1, "Province");
drawPoints(2, "City");
drawPoints(3, "Region", "City");

processPoints(false, false);

function drawPoints(level, key, key2) {
  if (level < 4) {
    var items = [];
    if (level == 0)
      items = [
        {
          key: key,
          Items: $scope.AutoServices,
        },
      ];
    // نمایش تمام آیتم های ایران
    else {
      items = _.chain($scope.AutoServices)
        .groupBy((item) => {
          return [item[key], item[key2]];
        })
        .map((value, key) => ({ key: key, Items: value }))
        .value();
    }

    _.forEach(items, (item) => {
      item.Ids = _.map(item.Items, "AutoServiceID").join(",");
    });

    angular.forEach(items, function (item) {
      if (item.Items && item.Items.length && item.Items[0].Coordinates) {
        L.tooltip({
          className: "custom-point level-" + level,
          direction: "center",
          permanent: true,
          interactive: true,
          noWrap: true,
          opacity: 0.9,
          Ids: item.Ids,
        })
          .setLatLng([
            item.Items[0].Coordinates.lat,
            item.Items[0].Coordinates.lng,
          ])
          .setContent(item.Items.length.toString())
          .addTo(map)
          .on("click", function (e, item) {
            if (e.target.options.Ids) {
              _.map($scope.AutoServices, (a) => (a.IsHide = true));
              _.map(e.target.options.Ids.split(","), (id) => {
                _.filter($scope.AutoServices, (a) => {
                  return a.AutoServiceID == id;
                }).map((auto) => {
                  auto.IsHide = false;
                });
              });
              $scope.$apply();
            }
            isRendered = false;
            processPoints(true, true, e.latlng);
          });
      }
    });
  }
}

function getLevel() {
  const zoom = map.getZoom();
  if (zoom <= 4) {
    return 0;
  } else if (zoom <= 5) {
    return 1;
  } else if (zoom > 5 && zoom <= 7) {
    return 2;
  } else if (zoom > 7 && zoom <= 9) {
    return 3;
  } else if (zoom > 9) {
    return 4;
  }
}

function processPoints(isMove, isZoom, latlng) {
  if (isRendered) return;

  $(".custom-point").hide();

  const level = isMove ? getLevel() + 1 : getLevel();

  if (level == 4) {
    // create markers
    var items = $scope.AutoServices;
    angular.forEach(items, function (item) {
      if (item.Coordinates) {
        const myCustomColour = item.Color;

        const markerHtmlStyles = `
          background-color: ${myCustomColour};
          width: 3rem;
          height: 3rem;
          display: block;
          left: -1.5rem;
          top: -1.5rem;
          position: relative;
          border-radius: 3rem 3rem 0;
          transform: rotate(45deg);
          border: 1px solid #FFFFFF`;

        const icon = L.divIcon({
          className: "my-custom-pin",
          iconAnchor: [0, 24],
          labelAnchor: [-6, 0],
          popupAnchor: [0, -36],
          html: `<span style="${markerHtmlStyles}" />`,
        });

        var marker = L.marker([item.Coordinates.lat, item.Coordinates.lng], {
          icon: icon,
          title: item.Title,
          draggable: false,
          name: "marker-" + item.AutoServiceID,
        }).addTo(map);

        marker.on("click", function (e) {
          var m = e.target;
          var autoServiceID = m.options.name.replace("marker-", "");
          $scope.$apply(function (a) {
            moduleController.callAction("GetAutoService", {
              "@AutoServiceID": autoServiceID,
            });
          });

          var popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(
              `
                <p>${$scope.AutoService.Title}</p>
                <a target="_blank" class="btn btn-default btn-sm mr-5"
                    href="whatsapp://send?text=http://castrol.ir/map?latlng=${e.latlng.lat},${e.latlng.lng}" data-action="share/whatsapp/share">
                   اشتراک گذاری
                </a>
                <a target="_blank" class="btn btn-default btn-sm mr-5"
                    href="https://www.google.com/maps?saddr=My+Location&daddr=${e.latlng.lat},${e.latlng.lng}">
                    مسیریابی
                </a>
                <a class="btn btn-default btn-sm mr-5" href="" 
                    onclick="window.print();">
                    چاپ صفحه
                </a>

             `
            )
            .openOn(map);
        });
      }
    });
    if (isZoom) map.setZoom(14);
  } else {
    map.eachLayer(function (layer) {
      // remove markers
      if (layer instanceof L.Marker) map.removeLayer(layer);
      //if (layer.options.name === 'XXXXX') {
      //    layer.setLatLng([newLat, newLon])
      //}
    });

    if (isMove && isZoom) map.setZoom(map.getZoom() + 2);

    $(".custom-point.level-" + level).fadeIn();
  }

  isRendered = true;
  setTimeout(function () {
    if (latlng) map.setView([latlng.lat, latlng.lng]);
    isRendered = false;
  }, 500);
}

setTimeout(() => {
  $("html, body").animate({ scrollTop: $("#map").position().top - 55 }, 1000);
});
