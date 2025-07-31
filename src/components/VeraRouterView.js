class VeraRouterView extends Component {
    init(props) {
        VeraJS.router()._setAnchorComponent(this);
    }

    getTemplate() {
        return `<div id="{id}" class="vera-router-view"></div>`;
    }

    render(component, params) {

    }
}

VeraJS.registerComponentClass("VERA-ROUTER-VIEW", VeraRouterView);