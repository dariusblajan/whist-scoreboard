import Immutable from 'immutable';

export const types = {
    ADD_PLAYER: 'ADD_PLAYER',
    UPDATE_PLAYER: 'UPDATE_PLAYER',
    REMOVE_PLAYER: 'REMOVE_PLAYER',

    CLOSE_SCORING_ROUND: 'CLOSE_SCORING_ROUND',
    REOPEN_SCORING_ROUND: 'REOPEN_SCORING_ROUND',
    UPDATE_SCORING_ROUND: 'UPDATE_SCORING_ROUND',
    RESET_ROUND_SCORES: 'RESET_ROUND_SCORES',

    SET_GAME_TYPE: 'SET_GAME_TYPE',
    SET_BETTING_PHASE: 'SET_BETTING_PHASE',
    START_GAME: 'START_GAME',
};

export const actions = {
    addPlayer: () => ({
        type: types.ADD_PLAYER,
    }),
    removePlayer: id => ({
        type: types.REMOVE_PLAYER,
        id
    }),
    updatePlayer: (index, key, value) => ({
        type: types.UPDATE_PLAYER,
        key,
        index,
        value
    }),

    resetRoundScores: () => ({
        type: types.RESET_ROUND_SCORES
    }),
    closeRound: () => ({
        type: types.CLOSE_SCORING_ROUND
    }),
    reopenRound: index => ({
        type: types.REOPEN_SCORING_ROUND,
        index
    }),
    setBettingPhase: value => ({
        type: types.SET_BETTING_PHASE,
        value
    }),
    updateRound: (index, playerIndex, key, value) => ({
        type: types.UPDATE_SCORING_ROUND,
        key,
        index,
        playerIndex,
        value
    }),
    setGameType: gameType => ({
        type: types.SET_GAME_TYPE,
        gameType
    }),
    startGame: () => ({
        type: types.START_GAME
    })
};

const initialState = Immutable.fromJS({
    players: [{
        name: 'player 1',
        score: 0
    }, {
        name: 'player 2',
        score: 0
    }, {
        name: 'player 3',
        score: 0
    }],
    rounds: [],
    type: 'long',
    roundIndex: 0,
    firstPlayerIndex: 0,
    lastPlayerIndex: 2
});

const addPlayer = (state) => {
    const newPlayers = state.get('players');

    return state.set('players', newPlayers.push(Immutable.fromJS({ name: `player ${newPlayers.size + 1}`, score: 0}))).update('lastPlayerIndex', idx => idx + 1);
};

const startGame = (state) => {
    const type = state.get('type');
    const players = state.get('players');
    let rounds = Immutable.List();

    const createRound = cards => Immutable.fromJS({
        cards,
        pointsLeft: cards,
        scores: players.map(() => Immutable.fromJS({
            currentScore: 0,
            roundScore: 0,
            bet: 0,
            okFlag: true,
            prize: false,
            penalty: false,
            bettingPhase: false,
        }))
    });

    if (type === 'long') {
        // 8 card rounds
        for (let i = 0; i < players.size; i++) {
            rounds = rounds.push(createRound(8).set('bettingPhase', true));
        }
        // 7 through 2 card rounds
        for (let i = 7; i > 1; i--) {
            rounds = rounds.push(createRound(i));
        }
        // 1 card rounds
        for (let i = 0; i < players.size; i++) {
            rounds = rounds.push(createRound(1));
        }
        // 2 through 7 card rounds
        for (let i = 2; i < 8; i++) {
            rounds = rounds.push(createRound(i));
        }
        // 8 card rounds
        for (let i = 0; i < players.size; i++) {
            rounds = rounds.push(createRound(8));
        }
    } else {
        // 1 card rounds
        for (let i = 0; i < players.size; i++) {
            rounds = rounds.push(createRound(1).set('bettingPhase', true));
        }
        // 2 through 7 card rounds
        for (let i = 2; i < 8; i++) {
            rounds = rounds.push(createRound(i));
        }
        // 8 card rounds
        for (let i = 0; i < players.size; i++) {
            rounds = rounds.push(createRound(8));
        }
        // 7 through 2 card rounds
        for (let i = 7; i > 1; i--) {
            rounds = rounds.push(createRound(i));
        }
        // 1 card rounds
        for (let i = 0; i < players.size; i++) {
            rounds = rounds.push(createRound(1));
        }
    }

    return state.set('rounds', rounds);
};

const closeRound = state => {
    const rounds = state.get('rounds');
    const current = state.get('roundIndex');

    if (current < rounds.size - 1) {
        return state.set('roundIndex', current + 1).setIn(['rounds', current + 1, 'bettingPhase'], true);
    } else {
        return state;
    }
};

const updateRound = (state, action) => {
    const { key, index, playerIndex, value } = action;

    if (key === 'bet') {
        return state.setIn(['rounds', index, 'scores', playerIndex, key], value);
    } else {
        const bet = state.getIn(['rounds', index, 'scores', playerIndex, 'bet']);
        const pointsLeft = state.getIn(['rounds', index, 'pointsLeft']);
        const lastRoundTotalScore = index === 0 ? 0 : state.getIn(['rounds', index - 1, 'scores', playerIndex, key]);
        const currentRoundScore = index === 0 ? 0 : state.getIn(['rounds', index - 1, 'scores', playerIndex, 'roundScore']);
        const currentScoreSum = state.getIn(['rounds', index, 'scores']).reduce((accum, data) => {
            return accum + data.get('roundScore');
        }, 0);
        const roundMaxPoints = state.getIn(['rounds', index, 'cards']);
        const valueIsValid = pointsLeft - value >= 0;
        if (bet === value) {
            return state.updateIn(['rounds', index, 'scores', playerIndex, 'currentScore'], cs => valueIsValid ? (lastRoundTotalScore + value + 5) : cs)
                .updateIn(['rounds', index, 'pointsLeft'], points => valueIsValid ? (roundMaxPoints - value - currentScoreSum + currentRoundScore) : points)
                .setIn(['rounds', index, 'scores', playerIndex, 'roundScore'], value);
        } else {
            return state.updateIn(['rounds', index, 'scores', playerIndex, 'currentScore'], cs => valueIsValid ? (lastRoundTotalScore - Math.abs(value - bet)) : cs)
                .updateIn(['rounds', index, 'pointsLeft'], points => valueIsValid ? (roundMaxPoints - value - currentScoreSum + currentRoundScore) : points)
                .setIn(['rounds', index, 'scores', playerIndex, 'roundScore'], value);
        }
    }
};

const resetRoundScores = state => {
    const roundIndex = state.get('roundIndex');
    let round = state.getIn(['rounds', roundIndex]);
    const rank = round.get('scores').size;

    for (let i = 0; i < rank; i++) {
        round = round.setIn(['scores', i, 'roundScore'], 0)
                    .setIn(['scores', i, 'currentScore'], roundIndex === 0 ? 0 : state.getIn(['rounds', roundIndex - 1, 'scores', i, 'currentScore']));
    }

    return state.setIn(['rounds', roundIndex], round);
};

const game = (state = initialState, action) => {
    switch(action.type) {
        case types.ADD_PLAYER:
            return addPlayer(state, action);
        case types.UPDATE_PLAYER:
            return state.setIn(['players', action.index, action.key], action.value);
        case types.REMOVE_PLAYER:
            return state.update('players', players => players.delete(action.id)).update('lastPlayerIndex', idx => idx - 1);
        case types.SET_GAME_TYPE:
            return state.set('type', action.gameType);
        case types.RESET_ROUND_SCORES:
            return resetRoundScores(state, action);
        case types.SET_BETTING_PHASE:
            return state.setIn(['rounds', state.get('roundIndex'), 'bettingPhase'], action.value);
        case types.START_GAME:
            return startGame(state, action);
        case types.CLOSE_SCORING_ROUND:
            return closeRound(state, action);
        case types.UPDATE_SCORING_ROUND:
            return updateRound(state, action);
        case types.REOPEN_SCORING_ROUND:
            return state.set('roundIndex', action.index);
        default:
            return state;
    }
};

export const selectors = {
    getPlayers: state => state.game.get('players'),
    getRounds: state => state.game.get('rounds'),
    getType: state => state.game.get('type'),
    getRoundIndex: state => state.game.get('roundIndex'),
    getCurrentRound: state => state.game.getIn(['rounds', state.game.get('roundIndex')]),
    getFirstPlayerIndex: state => state.game.get('firstPlayerIndex'),
    getLastPlayerIndex: state => state.game.get('lastPlayerIndex'),
    getBetSum: state => {
        const round = state.game.getIn(['rounds', state.game.get('roundIndex')]);
        const betSum = round.get('scores').reduce((accum, data) => {
            return accum + data.get('bet');
        }, 0);

        return betSum;
    }
};

export default game;