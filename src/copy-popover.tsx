import { Callout, IconButton } from "@radix-ui/themes";
import { type FC, type MouseEvent, useEffect, useState } from "react";
import classes from "./copy-popover.module.css";
import { CloseIcon, CopyIcon } from "./icons";

type Props = {
  text: string;
  title: string;
  onClose: () => void;
};

export const CopyPopover: FC<Props> = (props) => {
  const handleClick = async (event: MouseEvent) => {
    event.preventDefault();
    await navigator.clipboard.writeText(props.text);
    setMessage("Copied!");
  };

  const [message, setMessage] = useState<string>();

  useEffect(() => {
    if (message === undefined) {
      return;
    }
    const id = setTimeout(() => setMessage(undefined), 3000);
    return () => clearTimeout(id);
  }, [message]);

  return (
    <div className={classes.container}>
      <h3>{props.title}</h3>
      <Callout.Root className={classes.calloutRoot}>
        <Callout.Text>{props.text}</Callout.Text>
        <Callout.Icon className={classes.calloutIcon}>
          <IconButton size="1" variant="soft" onClick={handleClick}>
            <CopyIcon />
          </IconButton>
        </Callout.Icon>
        {message !== undefined && (
          <span className={classes.copiedMessage}>{message}</span>
        )}
      </Callout.Root>
      <IconButton
        size="1"
        variant="ghost"
        onClick={props.onClose}
        className={classes.closeIcon}
      >
        <CloseIcon />
      </IconButton>
    </div>
  );
};
