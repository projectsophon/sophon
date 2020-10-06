type cssClass;

[@bs.module "styled-components"] external css: string => cssClass = "css";

type iconColors = {
  twitter: string,
  github: string,
  telegram: string,
  email: string,
  blog: string,
};

type colors = {
  text: string,
  subtext: string,
  subbertext: string,
  subbesttext: string,
  // background: string,
  background: string,
  backgrounddark: string,
  backgroundlight: string,
  backgroundlighter: string,
  dfblue: string,
  dfgreen: string,
  dfred: string,
  icons: iconColors,
};

type rangeColors = {
  dash: string,
  dashenergy: string,
  colorenergy: string,
  color100: string,
  color50: string,
  color25: string,
};

type bonusColors = {
  energyCap: string,
  speed: string,
  def: string,
  energyGro: string,
  range: string,
};

type gameStyles = {
  active: string,
  animProps: string,
};

type game = {
  terminalWidth: string,
  fontSize: string,
  canvasbg: string,
  rangecolors: rangeColors,
  bonuscolors: bonusColors,
  toolbarHeight: string,
  terminalFontSize: string,
  styles: gameStyles,
};

type prefabs = {noselect: cssClass};

type styles = {
  colors,
  fontSize: string,
  fontSizeS: string,
  fontSizeXS: string,
  fontH1: string,
  fontH1S: string,
  fontH2: string,
  titleFont: string,
  screenSizeS: string,
  game,
  prefabs,
};

let dfstyles = {
  colors: {
    text: "#ffffff",
    subtext: "#a0a0a0",
    subbertext: "#565656",
    subbesttext: "#383838",
    // background: "#151518",
    background: "#080808",
    backgrounddark: "#080808",
    backgroundlight: "#282834",
    backgroundlighter: "#4a4a5a",
    dfblue: "#00ADE1",
    dfgreen: "#00DC82",
    dfred: "#FF6492",

    icons: {
      twitter: "#1DA1F2",
      github: "#8e65db",
      telegram: "#0088CC",
      email: "#D44638",
      blog: "#ffcb1f",
    },
  },

  fontSize: "16pt",
  fontSizeS: "12pt",
  fontSizeXS: "10pt",
  fontH1: "42pt",
  fontH1S: "36pt",
  fontH2: "24pt",

  titleFont: "perfect_dos_vga_437regular",

  screenSizeS: "660px",

  game: {
    terminalWidth: "240pt",
    fontSize: "12pt",
    canvasbg: "#100544",
    rangecolors: {
      dash: "#9691bf",
      dashenergy: "#f5c082",
      colorenergy: "#080330",
      color100: "#050228",
      color50: "#050233",
      color25: "#050238",
    },
    bonuscolors: {
      energyCap: "hsl(360, 73%, 70%)",
      speed: "hsl(290, 73%, 70%)",
      def: "hsl(231, 73%, 70%)",
      energyGro: "hsl(136, 73%, 70%)",
      range: "hsl(50, 73%, 70%)",
    },
    toolbarHeight: "12em",
    terminalFontSize: "10pt",

    styles: {
      active: "filter: brightness(80%)",
      animProps: "ease-in-out infinite alternate-reverse",
    },
  },

  prefabs:
    // https://stackoverflow.com/questions/826782/how-to-disable-text-selection-highlighting
    {
      noselect:
        css(
          {|
      -webkit-touch-callout: none; /* iOS Safari */
      -webkit-user-select: none; /* Safari */
      -khtml-user-select: none; /* Konqueror HTML */
      -moz-user-select: none; /* Old versions of Firefox */
      -ms-user-select: none; /* Internet Explorer/Edge */
      user-select: none;
    |},
        ),
    },
};

let default = dfstyles;
