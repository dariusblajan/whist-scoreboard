import React from 'react';
import { connect } from 'react-redux';
import { Typography, Button, withStyles, createStyles } from '@material-ui/core';
import { push } from 'connected-react-router';
import { gameSelectors, gameActions } from '../../ducks';
import Item from './Item';
import { withRouter } from 'react-router-dom';

const styles = createStyles(theme => ({
    playersView: {
        padding: theme.spacing(4, 6),
    },
    playerList: {
        margin: '0 auto',
        width: 400
    },
    addButton: {
        padding: '3px 5px'
    },
    actions: {
        marginTop: theme.spacing(10),
        display: 'flex',
        height: 100,
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'space-around'
    }
}));

const Players = props => {
    const {
        classes,
        players,
        updatePlayer,
        addPlayer,
        deletePlayer,
        startGame,
        history,
    } = props;

    const handleStartGame = () => {
        startGame();
        history.push('/game');
    };

    const handleGoBack = () => {
        history.push('/');
    };

    const allPlayersHaveNames = players
        .map(p => p.get('name'))
        .findIndex(p => p === '') === -1;

    return (
        <div className={classes.playersView}>
            <Typography variant="h4" gutterBottom align="center">Add Players here</Typography>
            <div className={classes.playerList}>
                {
                    players.map((p, idx) =>
                        <Item
                            key={idx}
                            index={idx}
                            player={p}
                            handlePlayerChange={updatePlayer}
                            handleRemovePlayer={deletePlayer}
                        />
                    )
                }
                {
                    players.size < 6 &&
                    <Button
                        fullWidth
                        className={classes.addButton}
                        color="secondary"
                        variant="contained"
                        onClick={addPlayer}
                    >
                        Add Player
                    </Button>
                }
            </div>
            <div className={classes.actions}>
                {
                    players.size >= 3 && allPlayersHaveNames &&
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={handleStartGame}
                    >
                        Play
                    </Button>
                }
                <Button
                    color="secondary"
                    variant="contained"
                    onClick={handleGoBack}
                >
                    Back
                </Button>
            </div>
        </div>
    );
};

export default connect(
    state => ({
        players: gameSelectors.getPlayers(state),
    }),
    dispatch => ({
        addPlayer() {
            dispatch(gameActions.addPlayer())
        },
        deletePlayer(index) {
            dispatch(gameActions.removePlayer(index))
        },
        removePlayer(id) {
            dispatch(gameActions.removePlayer(id))
        },
        updatePlayer(index, key, value) {
            dispatch(gameActions.updatePlayer(index, key, value))
        },
        goTo(path) {
            dispatch(push(path));
        },
        setDealer(index) {
            dispatch(gameActions.setDealer(index));
        },
        startGame() {
            dispatch(gameActions.startGame());
        }
    })
)(withRouter(withStyles(styles)(Players)));
