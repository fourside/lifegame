import { Component, type ErrorInfo, type ReactNode } from "react";
import classes from "./error-boundary.module.css";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class InlineErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(_: unknown) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          {this.props.children}
          <span className={classes.errorMessage}>error occured.</span>
        </div>
      );
    }
    return this.props.children;
  }
}
