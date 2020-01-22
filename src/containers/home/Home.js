import React from 'react';
import { connect } from 'react-redux';
import { Typography, TextField, MenuItem, Button, createStyles, withStyles } from '@material-ui/core';
import { gameSelectors, gameActions } from '../../ducks';
import { withRouter } from 'react-router-dom';

const styles = createStyles(theme => ({
    home: {
        padding: theme.spacing(4, 6),
    },
    form: {
        margin: '0 auto',
        width: 400
    },
    actions: {
        marginTop: theme.spacing(10),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around'
    }
}));

const Home = props => {
    const { classes, gameType, setGameType, history } = props;

    const handleTypeChange = e => {
        const { value } = e.target;
        setGameType(value);
    };

    const handleNext = () => {
        history.push('/players')
    };

    return (
        <div className={classes.home}>
            <Typography variant="h4" gutterBottom align="center">Chose a game type</Typography>
            <div className={classes.form}>
                <TextField
                    select
                    fullWidth
                    onChange={handleTypeChange}
                    value={gameType}
                >
                    <MenuItem value="long">Long (start with the 8 card rounds)</MenuItem>
                    <MenuItem value="short">Short (start with the 1 card rounds)</MenuItem>
                </TextField>
            </div>
            <div className={classes.actions}>
                <Button color="secondary" variant="contained" onClick={handleNext}>Next</Button>
            </div>
        </div>
    );
};

export default connect(
    state => ({
        gameType: gameSelectors.getType(state)
    }),
    dispatch => ({
        setGameType(type) {
            dispatch(gameActions.setGameType(type));
        }
    })
)(withRouter(withStyles(styles)(Home)));
