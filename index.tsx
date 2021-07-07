import React, { useState, useEffect } from 'react';
import AMap from '@/components/AMap';
import { Markers } from 'react-amap';
import { Input, message, Select } from 'antd';
import { debounce } from '@/utils';

const { Option } = Select;

import './index.less';

interface IF {
  // 开启点击地图可标记
  canClickMarker?: Boolean;
  // 开启搜索
  canSearch?: Boolean;
  // 搜索后返回数据
  returnSearchData?: Function;
  // 地图中心
  mapCenter?: Object;
  // 搜索选择回调
  onSelect?: Function;
  // 传一个地址进来，与getlnglat配合使用
  sendAddr?: string;
  // 根据 sendAddr 地址查找对应的经纬度并返回
  returnLnglat?: Function;
}

export default (props: IF) => {
  const [addrOptions, setAddrOptions] = useState<any>([]);

  const [amap, setAmap] = useState<any>(null);
  const [zoom, setZoom] = useState<number>(11);
  const [center, setCenter] = useState<any>({
    longitude: 116.407526,
    latitude: 39.90403
  });

  const [geocoder, setGeocoder] = useState<any>(null);
  const [autoComplete, setAutoComplete] = useState<any>(null);
  const [placeSearch, setPlaceSearch] = useState<any>(null);

  const [addrRes, setAddrRes] = useState<any>(null);
  const [markers, setMarkers] = useState<any>([]);

  useEffect(() => {
    console.log(props.mapCenter)
    if (props.mapCenter) {
      setCenter(props.mapCenter)
    }
  }, [props.mapCenter])

  useEffect(() => {
    if (props.sendAddr !== '') {
      getLnglat(props.sendAddr as string)
    }
  }, [props.sendAddr])

  // 初始化
  const handleAMapCreated = (ins: any) => {
    if (ins) {
      setAmap(ins);
      const AMAP = window.AMap;
      let _geocoder: any = null;
      let _autocomplete: any = null;
      let _placeSearch: any = null;

      if (AMAP) {
        AMAP.plugin(['AMap.Geocoder'], () => {
          _geocoder = new AMAP.Geocoder({
            radius: 1000,
            extensions: 'base',
          });
          setGeocoder(_geocoder);
        });

        // https://lbs.amap.com/api/javascript-api/reference/search#m_AMap.Autocomplete
        AMAP.plugin('AMap.Autocomplete', () => {
          _autocomplete = new AMAP.Autocomplete({
            // input: 'tipinput',
            city: '廊坊',
            citylimit: true,
            pageSize: 10,
            pageIndex: 1,
            outPutDirAuto: true,
          });
          setAutoComplete(_autocomplete);
        });

        AMAP.plugin('AMap.PlaceSearch', () => {
          _placeSearch = new AMAP.PlaceSearch({
            // input: 'tipinput',
            city: '廊坊',
            citylimit: true,
            type:
              '生活服务|体育休闲服务|医疗保健服务|住宿服务|风景名胜|商务住宅|政府机构及社会团体|科教文化服务|交通设施服务|金融保险服务|公司企业|道路附属设施|地名地址信息|公共设施',
            pageSize: 10,
            pageIndex: 1,
          });
          setPlaceSearch(_placeSearch);
        });
      }
    }
  };

  // 根据地址查找经纬度
  const getLnglat = (addr: string) => {
    if (addr === '') return
    geocoder.getLocation(addr, function (status: any, result: any) {
      if (status === 'complete' && result.geocodes.length) {
        let lnglat = result.geocodes[0].location
        setMarker(lnglat);
        props.returnLnglat && props.returnLnglat(lnglat)
      } else {
        props.returnLnglat && props.returnLnglat(null)
      }
    })
  }

  // 点击地图后获取经纬度以及位置
  const handleAMapClick = (ins: any) => {
    if (!props.canClickMarker) return;
    const { lnglat } = ins;
    setMarker(lnglat);

    const addressPoint = [lnglat.lng, lnglat.lat];
    geocoder.getAddress(addressPoint, (status: any, result: any) => {
      if (status !== 'complete') {
        message.error('地址解析失败');
        return;
      }
      setAddrRes(result);
    });
  };

  // 选择后搜索定位
  const handleTextChange = (id: any) => {
    let curr = null;
    for (let i = 0; i < addrOptions.length; i++) {
      if (id === addrOptions[i].id) {
        curr = addrOptions[i];
        break;
      }
    }
    props.returnSearchData && props.returnSearchData(curr)
    setMarker(curr.location);
    props.onSelect && props.onSelect(curr);
  };

  const setMarker = (lnglat: { lng: string; lat: string }) => {
    setCenter({
      longitude: lnglat.lng,
      latitude: lnglat.lat,
    });
    setMarkers([
      {
        position: {
          longitude: lnglat.lng,
          latitude: lnglat.lat,
        },
      },
    ]);
    setZoom(20);
  };

  // Select 输入事件监听，填充选择项
  const handleSearch = (val: any, isFocus = false) => {
    if (isFocus && addrOptions && addrOptions.length) return;

    placeSearch.search(val, (status: any, result: any) => {
      const { info, poiList } = result;
      if (result.length || info !== 'OK' || status !== 'complete') return;
      if (poiList.pois && Array.isArray(poiList.pois)) {
        setAddrOptions(poiList.pois);
      }
    });
  };

  return (
    <div className="amap-wrap">
      <AMap
        zoom={zoom}
        center={center}
        events={{
          click: handleAMapClick,
          created: handleAMapCreated,
        }}
      >
        {
          props.canSearch && (
            <div className="amap-wrap-search">
              <Select
                showSearch
                className="amap-wrap-search-comp"
                optionFilterProp="children"
                placeholder="请输入地址"
                onSearch={debounce(handleSearch, 1000)}
                onFocus={(event: any) => handleSearch(event.target.value, true)}
                onChange={handleTextChange}
              >
                {addrOptions.map((item: any) => {
                  return (
                    <Option key={item.id} value={item.id}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            </div>
          )
        }
        <Markers markers={markers}></Markers>
      </AMap>
    </div>
  );
};
