import React from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import { gameSelectors } from './ducks';

import {
    ThemeProvider,
    CssBaseline,
    Container,
    withStyles,
    createStyles
} from '@material-ui/core';
import theme, { globalStyles } from "./config/theme";

import TopBar from './TopBar/TopBar';
import Players from './containers/players/Players';
import Game from './containers/game/Game';
import Home from './containers/home/Home';

const styles = createStyles(theme => ({
    mainContainer: {
        background: theme.palette.grey[200],
        paddingTop: 64,
        height: '100%'
    },
    ...globalStyles
}));

const App = props => {
    const { classes, rounds } = props;

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <TopBar/>
            <Container maxWidth="xl" className={classes.mainContainer}>
                <Switch>
                    <Route path="/players"><Players/></Route>
                    {
                        rounds.size &&
                        <Route path="/game"><Game/></Route>
                    }
                    <Route exact path="/"><Home/></Route>
                    <Redirect to="/"/>
                </Switch>
            </Container>
        </ThemeProvider>
    );
};

export default connect(
    state => ({
        rounds: gameSelectors.getRounds(state)
    }),
    null
)(withRouter(withStyles(styles)(App)));
