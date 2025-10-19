import VeraJS from "../VeraJS.js";
import Component from "../Component.js";

class RouterView extends Component {

    init(props) {
        if (VeraJS.router()) {
            VeraJS.router().setAnchorComponent(this);
        }
    }

    getTemplate() {
        return '<div id="{id}" class="vera-router-view"></div>';
    }

}

export default RouterView;