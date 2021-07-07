import * as React from 'react';
import { Map } from 'react-amap';
import { config } from '@/utils';

class AMap extends React.Component<any, any> {
  render() {
    const { ...otherProps } = this.props;
    return <Map {...otherProps} amapkey={config.AMAPKEYS} />;
  }
}

export default AMap;
