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
    Button,
    Tooltip,
    Box
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
        betSum,
        dealer,
        setBettingPhase,
        resetRoundScore
    } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
    const [bettingPlayer, setBettingPlayer] = useState(firstPlayerIndex);
    const [scoringPlayer, setScoringPlayer] = useState(firstPlayerIndex);
    const unscoredPlayersNo = currentRound.get('scores').reduce((acc, data) => {
        return acc + (!data.get('scored') ? 1 : 0);
    }, 0);
    const lastUnscoredPlayerIndex = unscoredPlayersNo === 1 ? currentRound.get('scores').findIndex(x => !x.get('scored')) : -1;
    const notBetPlayersNo = currentRound.get('scores').reduce((acc, data) => {
        return acc + (!data.get('betIn') ? 1 : 0);
    }, 0);
    const possibleBets = [];
    for (let i = 0; i <= currentRound.get('hands'); i++) possibleBets.push(i);
    const allBetsIn = !currentRound.get('scores').find(x => x.get('betIn') === false);
    const allScored = !currentRound.get('scores').find(x => x.get('scored') === false);

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
    };

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
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                padding={2}
                marginBottom={2}
            >
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
            </Box>
            <Table className={classes.table}>
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox" align="center">
                            <icons.MusicAccidentalSharp/>
                        </TableCell>
                        {
                            players.map((player, i) => (
                                <TableCell key={i} align="center">
                                    { player.get('name') + (dealer === i ? ' (dealer)' : '') }
                                </TableCell>
                            ))
                        }
                        <TableCell align="center" className={classes.actionsCell}>
                            <icons.Asterisk fontSize="small"/>
                        </TableCell>
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
                                    { round.get('hands') }
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
                                                    {
                                                        players.getIn([idx, 'prizes']).find(x => x === i)
                                                        && roundIndex !== i
                                                        && <icons.Plus className={classes.plusIcon}/>
                                                    }
                                                    {
                                                        players.getIn([idx, 'penalities']).find(x => x === i)
                                                        && roundIndex !== i
                                                        && <icons.Minus className={classes.minusIcon}/>
                                                    }
                                                </span>
                                            </div>
                                        </TableCell>
                                    ))
                                }
                                <TableCell align="right">
                                    {
                                        roundIndex === i && allBetsIn &&
                                        <Tooltip title={round.get('bettingPhase') ? 'Close betting phase' : 'Reopen betting phase'}>
                                            <IconButton size="small" onClick={handleSetBettingPhase(!round.get('bettingPhase'))}>
                                                {
                                                    round.get('bettingPhase')
                                                    ? <icons.CashRemove/>
                                                    : <icons.CashPlus className={classes.prize}/>
                                                }
                                            </IconButton>
                                        </Tooltip>
                                    }
                                    {
                                        roundIndex === i && !round.get('bettingPhase') && allScored &&
                                        <Tooltip title="End round">
                                            <IconButton size="small" onClick={handleEndRound}>
                                                <icons.Check className={classes.prize}/>
                                            </IconButton>
                                        </Tooltip>
                                    }
                                    {
                                        roundIndex === i && !round.get('bettingPhase') && round.get('handsLeft') !== round.get('hands') &&
                                        <Tooltip title="Reset round">
                                            <IconButton size="small" onClick={resetRoundScore}>
                                                <icons.Undo/>
                                            </IconButton>
                                        </Tooltip>
                                    }
                                    {
                                        i < roundIndex &&
                                        <Tooltip title="Reopen round">
                                            <IconButton size="small" onClick={handleReopen(i)}>
                                                <icons.Refresh/>
                                            </IconButton>
                                        </Tooltip>
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
                                disabled={
                                    bettingPlayer === dealer
                                        ? (betSum + bet === currentRound.get('hands')) || notBetPlayersNo === players.size
                                        : allBetsIn
                                }
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
                <DialogTitle>Score(hands taken)</DialogTitle>
                <DialogContent className={classes.betList}>
                    {
                        possibleBets.map(bet => (
                            <IconButton
                                key={bet}
                                disabled={
                                    scoringPlayer === lastUnscoredPlayerIndex // this is the last unscored player
                                        ? bet !== currentRound.get('handsLeft')
                                        : bet > currentRound.get('handsLeft')
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
        betSum: gameSelectors.getBetSum(state),
        dealer: gameSelectors.getDealer(state)
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
