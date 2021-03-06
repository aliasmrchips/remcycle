import { HigherOrderComponent } from '@sunny-g/cycle-utils/src/interfaces';
import mapPropsStream from './mapPropsStream';
import { pick, shallowEquals } from '../util';

// TODO: use function overloading
export interface WithProps {
  ( namesOrPropsOrCreator: {} | ((props: {}) => {}) | string | string[],
    propsCreator?: ((props: {}) => {}),
  ): HigherOrderComponent;
}

/**
 */
const withProps: WithProps = (namesOrPropsOrCreator, propsCreator) =>
  mapPropsStream(propsSource => {
    const isPropCreatorFunction = (
      propsCreator === undefined && typeof namesOrPropsOrCreator === 'function'
    );
    const isProps = (
      propsCreator === undefined
      && namesOrPropsOrCreator !== null
      && !Array.isArray(namesOrPropsOrCreator)
      && typeof namesOrPropsOrCreator === 'object'
    );

    // propCreator function or props to merge
    if (isPropCreatorFunction || isProps) {
      return propsSource
        .map(props => {
          let newProps = props;

          try {
            newProps = (isPropCreatorFunction
              ? (namesOrPropsOrCreator as ({}) => {})(props)
              : namesOrPropsOrCreator);
          } catch (e) {
            console.error('error in `withProps` `propsCreator`:', e);
          } finally {
            return { ...props, ...newProps };
          }
        });
    }

    // props to watch + a props creator function
    const watchedPropNames = [].concat(namesOrPropsOrCreator);
    if (watchedPropNames.length === 0) {
      throw new Error('`withProps`: Define prop names to watch, or only define the `propsCreator`');
    }

    const watchedProps$ = propsSource
      .map(pick(watchedPropNames))
      .skipRepeatsWith(shallowEquals)
      .constant(null);

    const mappedProps$ = watchedProps$
      .sample((_, props) => {
        let newProps = props;

        try {
          newProps = propsCreator(props);
        } catch(e) {
          console.error('error in `withProps` `watchedPropsCreator`:', e);
        } finally {
          return newProps;
        }
      }, watchedProps$, propsSource)
      .map(newProps => {
        return (newProps !== undefined && newProps !== null) ? newProps : {}
      })
      .skipRepeatsWith(shallowEquals);

    return propsSource
      .sample((props, newProps) => ({
        ...props, ...newProps,
      }), propsSource, mappedProps$);
  });

export default withProps;
