import { ContextNode, Expression, HttpMethod } from '..'
import { ActionInterface } from '../model/action'
import { Component } from '../model/component'
import { Operation } from '../model/operation'
import { createCoreAction } from './core-action'

// App navigation
interface OpenNativeRouteParams {
  /**
   * The identifier of the route in mobile applications or the relative URL in web apps.
   */
  route: string,
  /**
   * Removes all the navigation history if set to true.
   *
   * Attention: this feature doesn't play well with Web Apps and Flutter.
   */
  shouldResetApplication?: boolean,
  /**
   * A Map containing all the data needed by the route. It will become query parameters in web applications. It doesn't
   * do anything in Flutter applications.
   */
  data?: Record<string, string>,
}

/**
 * Navigates to a local native route.
 *
 * @param params the action parameters: route, shouldResetApplication and data. See {@link OpenNativeRouteParams}.
 */
export const openNativeRoute = createCoreAction<OpenNativeRouteParams>('openNativeRoute')

interface OpenExternalUrlParams {
  /**
   * The URL of the web page.
   */
  url: string,
}

/**
 * Opens the browser with the provided URL.
 *
 * @param params the action parameters: url. See {@link OpenExternalUrlParams}.
 */
export const openExternalUrl = createCoreAction<OpenExternalUrlParams>('openExternalUrl')

// Beagle Navigation
interface IdentifiableComponent extends Component {
  id: string,
}

interface LocalView {
  /**
   * The component tree of this route. The root of this tree tree must have an id.
   */
  screen: IdentifiableComponent,
}

interface HttpAdditionalData {
  /**
   * The HTTP method to use when fetching the screen. Default is "get".
   */
  method?: HttpMethod,
  /**
   * The headers to send with the request.
   */
  headers?: Record<string, string>,
  /**
   * The body to send with the request. Invalid for GET requests.
   */
  body?: any,
}

interface RemoteView {
  /**
   * The URL of the screen to fetch.
   */
  url: Expression<string>,
  /**
   * When set to true, the front-end application will load this as soon as possible instead of waiting the navigation
   * action to be triggered.
   */
  shouldPrefetch?: boolean,
  /**
   * Component tree to show if the screen can't be fetched.
   */
  fallback?: Component,
  /**
   * Further customization for the request.
   */
  httpAdditionalData?: HttpAdditionalData,
}

export type Route = LocalView | RemoteView

interface BaseNavigationParams {
  // fixme: this might need include both the path and the value
  /**
   * The navigation context to set in this navigation. Each route (screen) can have a navigation-scoped context and
   * this is the way to set it. For instance, once we click in a "Buy now" button, we may want to send the user to
   * "/product", but "/product" might need to know which product we're talking about, one way to pass this information
   * is via the navigation context.
   *
   * Another use-case for this feature is when we want to return to a page with a new information. For example, when
   * finishing an order, we might need to ask the user for his/her address. After obtaining the address, we can send
   * the user back to the "finish-order" screen (popView) and send the address in the navigation context.
   *
   * By default, nothing is sent here.
   */
  navigationContext?: any,
}

interface RouteNavigationParams<T extends (Route | string) = Route> extends BaseNavigationParams {
  /**
   * The route to navigate to. It can be either a remote view, fetched from the backend, ou a local view, which is
   * just a new component tree. When it's local, the root of the tree must have an id, this will be used as the name
   * of the route in the local navigator.
   */
  route: T,
}

interface StackNavigationParams extends RouteNavigationParams {
  /**
   * Used to set the navigation controller for this stack. The navigation controller is an entity implemented in the
   * front-end that allows you to control the loading, error and success behavior when a navigation is triggered.
   *
   * Each navigation controller in the front-end is identified by a string. You can specify this string here so Beagle
   * can use this specific custom behavior for all navigations in this stack.
   */
  controllerId?: string,
}

const navigator = {
  pushStack: createCoreAction<StackNavigationParams>('pushStack'),
  pushView: createCoreAction<RouteNavigationParams>('pushView'),
  popView: createCoreAction<BaseNavigationParams>('popView'),
  popToView: createCoreAction<RouteNavigationParams<string>>('popToView'),
  resetStack: createCoreAction<StackNavigationParams>('resetStack'),
  resetApplication: createCoreAction<StackNavigationParams>('resetApplication'),
  popStack: createCoreAction<StackNavigationParams>('popStack'),
}

interface PushViewFunction {
  /**
   * Adds the provided route to the current stack.
   *
   * @param url the url to the screen to load
   * @returns an instance of Action
   */
  (url: Expression<string>): ActionInterface,
  /**
   * Adds the provided route to the current stack.
   *
   * @param options the parameters for this navigation:
   * - route: the screen to load. A {@link LocalView} or a {@link RemoteView}.
   * - navigationContext: the Context for this navigation. See {@link BaseNavigationParams}.
   * @returns an instance of Action
   */
  (...args: Parameters<typeof navigator.pushView>): ReturnType<typeof navigator.pushView>,
}

interface PushStackFunction {
  /**
   * Adds a new stack to the navigator with the provided route.
   *
   * @param url the url to the screen to load
   * @returns an instance of Action
   */
  (url: Expression<string>): ActionInterface,
  /**
   * Adds a new stack to the navigator with the provided route.
   *
   * @param options the parameters for this navigation:
   * - route: the screen to load. A {@link LocalView} or a {@link RemoteView}.
   * - controllerId: the id for the navigation controller to use. See {@link StackNavigationParams}.
   * - navigationContext: the Context for this navigation. See {@link BaseNavigationParams}.
   * @returns an instance of Action
   */
  (...args: Parameters<typeof navigator.pushStack>): ReturnType<typeof navigator.pushStack>,
}

interface PopStackFunction {
  /**
   * Goes back to the previous route in the current stack.
   *
   * @returns an instance of Action
   */
   (): ActionInterface,
  /**
   * Goes back to the previous route in the current stack.
   *
   * @param options the parameters for this navigation:
   * - navigationContext: the Context for this navigation. See {@link BaseNavigationParams}.
   * @returns an instance of Action
   */
   (...args: Parameters<typeof navigator.popStack>): ReturnType<typeof navigator.popStack>,
}

interface PopToViewFunction {
  /**
   * Goes back to the route identified by the string passed as parameter. If the route doesn't exist in the current
   * stack, nothing happens.
   *
   * @param routeId the identifier of the route to go back to. For RemoteViews, this identifier will be the url. For
   * LocalViews, it will the id of the root component.
   * @returns an instance of Action
   */
  (routeId: Expression<string>): ActionInterface,
  /**
   * Goes back to the route identified by the options passed as parameter (route). If the route doesn't exist in the
   * current stack, nothing happens.
   *
   * @param options the parameters for this navigation:
   * - route: the identifier for the screen to go back to.
   * - navigationContext: the Context for this navigation. See {@link BaseNavigationParams}.
   * @returns an instance of Action
   */
  (...args: Parameters<typeof navigator.popToView>): ReturnType<typeof navigator.popToView>,
}

interface ResetStackFunction {
  /**
   * Removes the current stack and adds a new one with the provided route.
   *
   * @param url the url to the screen to load
   * @returns an instance of Action
   */
  (url: Expression<string>): ActionInterface,
  /**
   * Removes the current stack and adds a new one with the provided route.
   *
   * @param options the parameters for this navigation:
   * - route: the screen to load. A {@link LocalView} or a {@link RemoteView}.
   * - controllerId: the id for the navigation controller to use. See {@link StackNavigationParams}.
   * - navigationContext: the Context for this navigation. See {@link BaseNavigationParams}.
   * @returns an instance of Action
   */
  (...args: Parameters<typeof navigator.resetStack>): ReturnType<typeof navigator.resetStack>,
}

interface PopViewFunction {
  /**
   * Goes back to the previous route.
   *
   * @returns an instance of Action
   */
  (): ActionInterface,
  /**
   * Goes back to the previous route.
   *
   * @param options the parameters for this navigation:
   * - navigationContext: the Context for this navigation. See {@link BaseNavigationParams}.
   * @returns an instance of Action
   */
  (...args: Parameters<typeof navigator.popView>): ReturnType<typeof navigator.popView>,
}

interface ResetApplicationFunction {
  /**
   * Removes all the stacks and adds a new one with the provided route.
   *
   * @param url the url to the screen to load
   * @returns an instance of Action
   */
  (url: Expression<string>): ActionInterface,
  /**
   * Removes all the stack and adds a new one with the provided route.
   *
   * @param options the parameters for this navigation:
   * - route: the screen to load. A {@link LocalView} or a {@link RemoteView}.
   * - controllerId: the id for the navigation controller to use. See {@link StackNavigationParams}.
   * - navigationContext: the Context for this navigation. See {@link BaseNavigationParams}.
   * @returns an instance of Action
   */
  (...args: Parameters<typeof navigator.resetApplication>): ReturnType<typeof navigator.resetApplication>,
}

function getParams(options: any, isPopToView = false) {
  return (typeof options === 'string' || options instanceof ContextNode || options instanceof Operation)
    ? { route: isPopToView ? options : { url: options } }
    : options
}

export const pushView: PushViewFunction = (options: any) => navigator.pushView(getParams(options))
export const pushStack: PushStackFunction = (options: any) => navigator.pushStack(getParams(options))
export const resetStack: ResetStackFunction = (options: any) => navigator.resetStack(getParams(options))
export const resetApplication: ResetApplicationFunction = (options: any) => (
  navigator.resetApplication(getParams(options))
)
export const popToView: PopToViewFunction = (options: any) => navigator.popToView(getParams(options, true))
export const popView: PopViewFunction = (...args: any[]) => navigator.popView(args[0] ?? {})
export const popStack: PopStackFunction = (...args: any[]) => navigator.popStack(args[0] ?? {})
