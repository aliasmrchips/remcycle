import { ComponentClass } from '@types/react';
import { Component, HigherOrderComponent } from '@sunny-g/cycle-utils/es2015/interfaces';
import addActionHandlers, { Handlers } from './hoc/addActionHandlers';
import isolate from './hoc/isolate';
import { compose, omit, pick, pipe } from './util';

export interface CreateComponentOptions {
  main: Component;
  handlers: Handlers;
  children: {
    keys: string | string[];
    sources: HigherOrderComponent | HigherOrderComponent[];
    sinks: HigherOrderComponent | HigherOrderComponent[];
  };
  wrapper: HigherOrderComponent;
  sinks: HigherOrderComponent | HigherOrderComponent[];
  sources: HigherOrderComponent | HigherOrderComponent[];
  isolate: false | ((Sources: any) => (null | string | {}));
}

export interface CreateComponent {
  (options: CreateComponentOptions): Component;
}

const identity = x => x;
const defaultChildren = {
  keys: '',
  sources: identity,
  sinks: identity,
};

const baseChildrenHOC = _keys => BaseComponent => _sources => {
  const keys = [].concat(_keys);
  const children = pick(keys, _sources);
  const sources = omit(keys, _sources);

  const sinks = BaseComponent(sources);
  return { ...sinks, ...children };
}

/**
 * Creates a Cycle.js-compliant component in layers of higher-order components, built around either a React view component or an existing Cycle.js component
 *
 * Each property results in an HOC and is applied in the following order:
 *  - main      : the base component to be wrapped
 *  - handlers  : React function callbacks to be passed as props (usually, only used with `view`)
 *  - children  : object (soon to be array of objects) of HOCs to define what children should be rendered and how their collective state should be maintained
 *  - wrapper   : HOC defining any low level functionality required for this component or it's children (usually, only used with `main`)
 *  - sinks     : HOC of sink transformations
 *  - sources   : HOC of source transformations
 *  - isolate   : function returning the isolation configuration to be applied to all instances of this component
 *
 * By applying these HOCs in this order, we get the resulting mental model:
 *  - main:
 *    - main takes in most-manipulated sources, least-manipulated sinks
 *  - handlers
 *    - takes in all non-callback props, adds function callbacks as props
 *    - emits least-manipulated actions using the most-complete props available
 *  - children
 *    - receives most-manipulated sources
 *    - merges/combines its own sinks with least-manipulated sinks
 *  - wrapper
 *    - performs any last-minute source manipulation for `main`, `view`, and/or `children`
 *    - provides lowest-level interface for sink manipulation
 *  - sinks
 *    - performs manipulation of sinks with sources available from source manipulations
 *  - sources
 *    - performs manipulation of sources passed in from the parent components
 */
const createComponent: CreateComponent = (options = {}) => {
  const {
    main,
    handlers = {},
    children = defaultChildren,
    wrapper = identity,
    sinks = identity,
    sources = identity,
    isolate: isolateOptions = false,
  } = options;

  if (main === undefined) {
    throw new Error('Missing parameter: `main` Cycle component required');
  }

  const handlersHOC = addActionHandlers(handlers);
  const childrenHOC = (children === defaultChildren) ?
    identity :
    compose(
      compose(...[].concat(children.sources)),
      pipe(...[].concat(children.sinks)),
      baseChildrenHOC(children.keys),
    );
  const sinksHOC = pipe(...([].concat(sinks)));
  const sourcesHOC = compose(...([].concat(sources)));
  const isolateHOC = (isolateOptions === false) ?
    identity :
    isolate(isolateOptions);

  const mainHOC = compose(
    isolateHOC,
    sourcesHOC,
    sinksHOC,
    wrapper,
    childrenHOC,
    handlersHOC,
  );

  return mainHOC(main);
}

export default createComponent;