module Router = {
  [@bs.module "react-router-dom"] [@react.component]
  external make: (~children: React.element) => React.element = "BrowserRouter";
};

module Switch = {
  [@bs.module "react-router-dom"] [@react.component]
  external make: (~children: React.element) => React.element = "Switch";
};

module Route = {
  [@bs.module "react-router-dom"] [@react.component]
  external make:
    (~path: string, ~component: React.component('a)) => React.element =
    "Route";
};

[@bs.module "./GameLandingPage"] [@bs.val]
external gameLandingPage: React.component(unit) = "GameLandingPage";

let color = Dfstyles.dfstyles.colors.text;
let background = Dfstyles.dfstyles.colors.backgrounddark;

module Application = [%styled.div
  {j|
  height: 100%;
  width: 100%;
  color: $color;
  background: $background;
|j}
];

let default = () =>
  <Application>
    <Router>
      <Switch>
        <Route path="/" component=gameLandingPage />
        <Route path="/game1" component=gameLandingPage />
      </Switch>
    </Router>
  </Application>;
// <Route path="/wallet/:addr/:actionId/:balance/:method" component={TxConfirmPopup} />
