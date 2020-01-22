import { combineReducers } from "redux";
import { connectRouter } from "connected-react-router";
import game from "./game";

export default history => combineReducers({
    router: connectRouter(history),
    game,
});

export {
    types as gameTypes,
    actions as gameActions,
    selectors as gameSelectors,
} from './game';