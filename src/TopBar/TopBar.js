import React, { useState } from 'react';
import { AppBar, Typography, createStyles, withStyles, BottomNavigation, BottomNavigationAction } from '@material-ui/core';
import { withRouter } from 'react-router-dom';
import * as icons from 'mdi-material-ui';

const styles = createStyles(theme => ({
    navContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: '1 1 55%'
    },
    appBar: {
        position: 'fixed',
        height: 64,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: theme.spacing(0, 2)
    },
    title: {
        flex: '1 1 45%',
        display: 'inline-block'
    },
    nav: {
        background: theme.palette.primary.main,
        color: theme.palette.common.white
    },
    actionRoot: {
        '&$selected': {
            color: theme.palette.common.white
        }
    }
}));

const TopBar = props => {
    const { classes, history, location } = props;
    const [route, setRoute] = useState(location.pathname);

    const handleRouteChange = (e, value) => {
        history.push(value);
        setRoute(value);
    };

    return (
        <AppBar className={classes.appBar}>
            <Typography variant="h5" className={classes.title} align="center">
                Whist game interface
            </Typography>
            {/* <div className={classes.navContainer}>
                <BottomNavigation
                    onChange={handleRouteChange}
                    value={route}
                    showLabels
                    className={classes.nav}
                >
                    <BottomNavigationAction classes={{ root: classes.actionRoot }} label="Home" icon={<icons.Home/>} value="/"/>
                    <BottomNavigationAction classes={{ root: classes.actionRoot }} label="Players" icon={<icons.AccountMultiple/>} value="/players"/>
                    <BottomNavigationAction classes={{ root: classes.actionRoot }} label="Game" icon={<icons.Gamepad/>} value="/game"/>
                </BottomNavigation>
            </div> */}
        </AppBar>
    );
};

export default withRouter(withStyles(styles)(TopBar));
