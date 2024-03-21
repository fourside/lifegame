import { Component, type ErrorInfo, type ReactNode } from "react";
import classes from "./error-boundary.module.css";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class FormErrorBoundary extends Component<Props, State> {
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
    return (
      <>
        {this.props.children}
        {this.state.hasError && (
          <span className={classes.errorMessage}>error occured.</span>
        )}
      </>
    );
  }
}
