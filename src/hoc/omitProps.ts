import { HigherOrderComponent } from '@sunny-g/cycle-utils/src/interfaces';
import mapProps from './mapProps';
import { omit } from '../util';

export interface OmitProps {
  (propNames: string | string[]): HigherOrderComponent;
}

const omitProps = propNames => {
  const omitter = omit([].concat(propNames));

  return mapProps(omitter);
}

export default omitProps;
