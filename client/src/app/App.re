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

// TODO: cleanup
%bs.raw
{| import classes from "./application.module.css" |};
let applicationClass: string = [%bs.raw {|classes.application |}];

let default = () =>
  <div className=applicationClass>
    <Router>
      <Switch>
        <Route path="/" component=gameLandingPage />
        <Route path="/game1" component=gameLandingPage />
      </Switch>
    </Router>
  </div>;
// <Route path="/wallet/:addr/:actionId/:balance/:method" component={TxConfirmPopup} />
