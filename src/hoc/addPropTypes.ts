import { of } from 'most';
import { hold } from '@most/hold';
import mapSources from '@sunny-g/cycle-utils/es2015/mapSources';
import { HigherOrderComponent } from '@sunny-g/cycle-utils/es2015/interfaces';
import PropTypes from 'prop-types';
import { isProd, mapObj } from '../util';

const addPropTypes = (name, propTypes = {}): HigherOrderComponent =>
  mapSources('props', (propsSource = of({})) => ({
    props: isProd() ? propsSource : propsSource
      .tap(props => {
        try {
          PropTypes.checkPropTypes(propTypes, props, 'prop', name);
        } catch (_) {}
      })
      .thru(hold),
  }));

export default addPropTypes;