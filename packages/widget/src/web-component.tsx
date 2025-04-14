/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/no-namespace */
import toWebComponent from "@r2wc/react-to-web-component";
import { Widget } from "./widget/Widget";
import { SignerGetters, SkipClientOptions } from "@skip-go/client";
import { Callbacks } from "./state/callbacks";

type WebComponentProps = {
  container: {
    attributes: Record<string, string>[];
  };
};

function isJsonString(str: string) {
  try {
    JSON.parse(str);
  } catch (_err) {
    return false;
  }
  return true;
}

const camelize = (inputString: string) => {
  inputString = inputString.toLowerCase();
  return inputString.replace(/-./g, (x) => x[1].toUpperCase());
};

type FuncProps = Pick<
  NonNullable<SkipClientOptions["endpointOptions"]>,
  "getRestEndpointForChain" | "getRpcEndpointForChain"
> &
  SignerGetters &
  Callbacks;

const WidgetWithProvider = (props: WebComponentProps & FuncProps) => {
  const parsedProps = Array.from(props.container.attributes).map(({ name, value }) => {
    return { key: name, value };
  });

  const realProps = parsedProps.reduce(
    (accumulator, initialValue) => {
      const { key, value } = initialValue;

      accumulator[camelize(key)] = isJsonString(value) ? JSON.parse(value) : value;
      return accumulator;
    },
    {} as Record<string, object | string>,
  );

  const { container, ...funcProps } = props;

  const endpointOptions = (realProps.endpointOptions || {}) as object;

  if (funcProps.getRestEndpointForChain) {
    realProps.endpointOptions = {
      ...endpointOptions,
      getRestEndpointForChain: funcProps.getRestEndpointForChain,
    };
  }

  if (funcProps.getRpcEndpointForChain) {
    realProps.endpointOptions = {
      ...endpointOptions,
      getRpcEndpointForChain: funcProps.getRpcEndpointForChain,
    };
  }

  const { getRestEndpointForChain, getRpcEndpointForChain, ...rootFuncProps } = funcProps;

  return <Widget {...realProps} {...rootFuncProps} />;
};

const WEB_COMPONENT_NAME = "skip-widget";

const WebComponent = toWebComponent(WidgetWithProvider, {
  props: {
    getCosmosSigner: "function",
    getEVMSigner: "function",
    getSVMSigner: "function",
    onWalletConnected: "function",
    onWalletDisconnected: "function",
    onTransactionBroadcasted: "function",
    onTransactionComplete: "function",
    onTransactionFailed: "function",
    getRpcEndpointForChain: "function",
    getRestEndpointForChain: "function",
  },
});

function initializeSkipWidget() {
  if (!customElements.get(WEB_COMPONENT_NAME)) {
    customElements.define(WEB_COMPONENT_NAME, WebComponent);
  }

  // Upgrade any existing skip-widget elements
  document.querySelectorAll(WEB_COMPONENT_NAME).forEach((el) => {
    customElements.upgrade(el);
  });
}

initializeSkipWidget();

export default WebComponent;

type Stringify<T> = {
  [K in keyof T]?: string;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [WEB_COMPONENT_NAME]: Stringify<WebComponentProps>;
    }
  }
}
