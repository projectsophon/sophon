import React from 'react';
import styled from 'styled-components';
import {
  TooltipName,
} from '../../utils/WindowManager';

// activate TooltipName on mouseenter, deactivate on mouse leave
type DisplayType = 'inline' | 'block' | 'inline-block' | 'inline-flex' | 'flex';
type TooltipProps = {
  children: React.ReactNode;
  name: TooltipName;
  needsShift?: boolean;
  display?: DisplayType;
  style?: React.CSSProperties;
  className?: string;
};

const StyledTooltipTrigger = styled.span<{
  display?: DisplayType;
}>`
  border-radius: 2px;

  display: ${(props) => props.display || 'inline'};
`;

export function TooltipTrigger({
  children,
  display,
  style,
  className,
}: TooltipProps): JSX.Element {
  return (
    <StyledTooltipTrigger
      display={display}
      style={{ ...style }}
      className={className}
    >
      {children}
    </StyledTooltipTrigger>
  );
}

export function Tooltip(): JSX.Element {
  return (
    null
  );
}
