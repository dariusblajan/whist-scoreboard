import React from 'react';
import { withRouter } from 'react-router-dom';
import {
    AppBar,
    Typography,
    createStyles,
    withStyles,
} from '@material-ui/core';

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
}));

const TopBar = props => {
    const { classes } = props;

    return (
        <AppBar className={classes.appBar}>
            <Typography variant="h5" className={classes.title} align="center">
                Whist game interface
            </Typography>
        </AppBar>
    );
};

export default withRouter(withStyles(styles)(TopBar));
