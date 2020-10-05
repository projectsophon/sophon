import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import dfstyles from '../../styles/dfstyles';
import WindowManager, {
  TooltipName,
  WindowManagerEvent,
  GameWindowZIndex,
} from '../../utils/WindowManager';
import { TooltipContent } from './TooltipPanes';

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
  name,
  needsShift,
  display,
  style,
  className,
}: TooltipProps) {
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

const StyledTooltip = styled.div`
  position: absolute;
  width: fit-content;
  height: fit-content;
  min-height: 1em;
  min-width: 5em;
  border: 1px solid ${dfstyles.colors.text};
  background: ${dfstyles.colors.background};
  padding: 0.5em;
  border-radius: 3px;

  z-index: ${GameWindowZIndex.Tooltip};
`;

export function Tooltip() {
  return (
    null
  );
}
