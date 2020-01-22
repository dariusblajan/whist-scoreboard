import React, { useState } from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import * as icons from 'mdi-material-ui';
import {
    Table,
    TableHead,
    TableCell,
    TableRow,
    TableBody,
    withStyles,
    createStyles,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    Button
} from '@material-ui/core';
import { gameSelectors, gameActions } from '../../ducks';
import { withRouter } from 'react-router-dom';

const styles = createStyles(theme => ({
    tableContainer: {
        height: 750,
        padding: theme.spacing(4, 6),
        overflow: 'auto',
    },
    table: {
        marginRight: 'auto',
        marginLeft: 'auto',
        border: '2px solid black'
    },
    scoreCell: {
        position: 'relative',
        fontSize: 20
    },
    scoreContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    currentScore: {
        flex: '0 1 75%',
        borderRight: `1px solid ${theme.palette.grey[500]}`,
        display: 'flex',
        alignItems: 'center',
    },
    bet: {
        flex: '0 1 25%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    plusIcon: {
        position: 'absolute',
        fontSize: 20,
        right: 8,
        top: 5,
        color: theme.palette.success.main
    },
    minusIcon: {
        position: 'absolute',
        fontSize: 20,
        right: 8,
        top: 5,
        color: theme.palette.error.main
    },
    prize: {
        color: theme.palette.success.main
    },
    roundNo: {
        fontWeight: 600
    },
    roundIndex: {
        background: theme.palette.secondary.main,
    },
    crtCell: {
        color: theme.palette.common.white
    },
    actionsCell: {
        width: 150
    },
    betList: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    betCoin: {
        flex: '0 1 33.33%'
    },
    topActions: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing(2),
        marginBottom: theme.spacing(2)
    }
}));

// TODO: prevent ending round if not all scores are in

const Game = props => {
    const {
        classes,
        history,
        players,
        rounds,
        roundIndex,
        currentRound,
        closeRound,
        reopenRound,
        updateRound,
        firstPlayerIndex,
        lastPlayerIndex,
        betSum,
        setBettingPhase,
        resetRoundScore
    } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
    const [bettingPlayer, setBettingPlayer] = useState(firstPlayerIndex);
    const [scoringPlayer, setScoringPlayer] = useState(firstPlayerIndex);
    const unscoredPlayersNo = currentRound.get('scores').reduce((accum, data) => {
        return accum + (!data.get('roundScore') ? 1 : 0);
    }, 0);
    const possibleBets = [];
    for (let i = 0; i <= currentRound.get('cards'); i++) possibleBets.push(i);

    const handleEndRound = () => {
        closeRound();
    };

    const handleReopen = index => () => {
        reopenRound(index);
    };

    const handlePlayerBet = value => () => {

        updateRound(roundIndex, bettingPlayer, 'bet', +value);
        setDialogOpen(false);
    };

    const handlePlayerScore = value => () => {

        updateRound(roundIndex, scoringPlayer, 'currentScore', +value);
        setScoreDialogOpen(false);
    };

    const handleOpenScoreDialog = playerIdx => () => {
        setScoringPlayer(playerIdx);
        setScoreDialogOpen(true);
    };

    const handleCloseScoreDialog = () => {
        setScoreDialogOpen(false);
    }

    const handleOpenDialog = playerIdx => () => {
        setBettingPlayer(playerIdx);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const handleSetBettingPhase = value => () => {
        setBettingPhase(value);
    };

    return (
        <div className={classes.tableContainer}>
            <div className={classes.topActions}>
                <Button
                    color="primary"
                    variant="contained"
                    onClick={() => history.push('/players')}
                >
                    <icons.ChevronLeft /> Players
                </Button>
                <Button
                    variant="contained"
                    onClick={() => history.push('/')}
                >
                    <icons.Close /> End game
                </Button>
            </div>
            <Table className={classes.table}>
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox" align="center">#</TableCell>
                        {
                            players.map((player, i) => (
                                <TableCell key={i} align="center">
                                    { player.get('name') }
                                </TableCell>
                            ))
                        }
                        <TableCell align="center" className={classes.actionsCell}><icons.Asterisk/></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {
                        rounds.map((round, i) => (
                            <TableRow key={i} className={cn({
                                [classes.roundIndex]: roundIndex === i
                            })}>
                                <TableCell
                                    align="center"
                                    className={cn({
                                        [classes.crtCell]: roundIndex === i,
                                        [classes.roundNo]: true
                                    })}
                                >
                                    { round.get('cards') }
                                </TableCell>
                                {
                                    round.get('scores').map((score, idx) => (
                                        <TableCell
                                            key={idx}
                                            className={cn({
                                                [classes.crtCell]: roundIndex === i,
                                                [classes.scoreCell]: true
                                            })}
                                        >
                                            <div className={classes.scoreContainer}>
                                                <span className={classes.currentScore}>
                                                    { 
                                                        roundIndex === i && !round.get('bettingPhase')
                                                        ? <IconButton size="small" onClick={handleOpenScoreDialog(idx)}>
                                                            { score.get('currentScore') }
                                                        </IconButton>
                                                        : roundIndex >= i ? score.get('currentScore') : '' }
                                                </span>
                                                <span className={classes.bet}>
                                                    {
                                                        roundIndex === i && round.get('bettingPhase')
                                                        ? <IconButton size="small" onClick={handleOpenDialog(idx)}>
                                                            { score.get('bet') }
                                                        </IconButton>
                                                        : roundIndex >= i ? score.get('bet') : ''
                                                    }
                                                    { score.get('prize') && roundIndex !== i && <icons.Plus className={classes.plusIcon}/> }
                                                    { score.get('penalty') && roundIndex !== i && <icons.Minus className={classes.minusIcon}/> }
                                                </span>
                                            </div>
                                        </TableCell>
                                    ))
                                }
                                <TableCell align="right">
                                    {
                                        roundIndex === i &&
                                        <IconButton size="small" onClick={handleSetBettingPhase(!round.get('bettingPhase'))}>
                                            {
                                                round.get('bettingPhase')
                                                ? <icons.CashRemove/>
                                                : <icons.CashPlus className={classes.prize}/>
                                            }
                                        </IconButton>
                                    }
                                    {
                                        roundIndex === i && !round.get('bettingPhase') && !round.get('pointsLeft') &&
                                        <IconButton size="small" onClick={handleEndRound}>
                                            <icons.Check className={classes.prize}/>
                                        </IconButton>
                                    }
                                    {
                                        roundIndex === i && !round.get('bettingPhase') && round.get('pointsLeft') !== round.get('cards') &&
                                        <IconButton size="small" onClick={resetRoundScore}>
                                            <icons.Undo/>
                                        </IconButton>
                                    }
                                    {
                                        i < roundIndex &&
                                        <IconButton size="small" onClick={handleReopen(i)}>
                                            <icons.Refresh/>
                                        </IconButton>
                                    }
                                </TableCell>
                            </TableRow>
                        ))
                    }
                </TableBody>
            </Table>
            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                maxWidth="xs"
            >
                <DialogTitle>Bet</DialogTitle>
                <DialogContent className={classes.betList}>
                    {
                        possibleBets.map(bet => (
                            <IconButton
                                key={bet}
                                onClick={handlePlayerBet(bet)}
                                className={classes.betCoin}
                                disabled={lastPlayerIndex === bettingPlayer && betSum + bet === currentRound.get('cards')}
                            >
                                { bet }
                            </IconButton>
                        ))
                    }
                </DialogContent>
            </Dialog>
            <Dialog
                open={scoreDialogOpen}
                onClose={handleCloseScoreDialog}
                maxWidth="xs"
            >
                <DialogTitle>Score</DialogTitle>
                <DialogContent className={classes.betList}>
                    {
                        possibleBets.map(bet => (
                            <IconButton
                                key={bet}
                                disabled={
                                    unscoredPlayersNo === 1
                                    ? currentRound.get('pointsLeft') < currentRound.get('cards')
                                        && bet !== currentRound.get('pointsLeft')
                                    : currentRound.get('pointsLeft') < currentRound.get('cards')
                                        && bet > currentRound.get('pointsLeft')
                                }
                                onClick={handlePlayerScore(bet)}
                                className={cn({
                                    [classes.betCoin]: true,
                                    [classes.prize]: currentRound.getIn(['scores', scoringPlayer, 'bet']) === bet
                                })}
                            >
                                { bet }
                            </IconButton>
                        ))
                    }
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default connect(
    state => ({
        players: gameSelectors.getPlayers(state),
        rounds: gameSelectors.getRounds(state),
        roundIndex: gameSelectors.getRoundIndex(state),
        currentRound: gameSelectors.getCurrentRound(state),
        firstPlayerIndex: gameSelectors.getFirstPlayerIndex(state),
        lastPlayerIndex: gameSelectors.getLastPlayerIndex(state),
        betSum: gameSelectors.getBetSum(state)
    }),
    dispatch => ({
        updatePlayer(index, key, value) {
            dispatch(gameActions.updatePlayer(index, key, value));
        },
        updateRound(index, playerIndex, key, value) {
            dispatch(gameActions.updateRound(index, playerIndex, key, value));
        },
        closeRound() {
            dispatch(gameActions.closeRound());
        },
        reopenRound(index) {
            dispatch(gameActions.reopenRound(index));
        },
        setBettingPhase(value) {
            dispatch(gameActions.setBettingPhase(value));
        },
        resetRoundScore() {
            dispatch(gameActions.resetRoundScores());
        }
    })
)(withStyles(styles)(withRouter(Game)));
