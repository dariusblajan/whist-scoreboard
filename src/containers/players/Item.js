import React, { useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { gameSelectors, gameActions } from '../../ducks';

import {
    createStyles,
    TextField,
    Typography,
    withStyles,
    IconButton,
    FormControlLabel,
    Checkbox
} from '@material-ui/core';
import * as icons from 'mdi-material-ui';

const styles = createStyles(theme => ({
    player: {
        marginBottom: 8,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    }
}));

const Item = props => {
    const { classes, player, handlePlayerChange, handleRemovePlayer, index, dealer, setDealer } = props;
    const [editing, setEditing] = useState(false);

    const handleChange = name => e => {
        handlePlayerChange(index, name, e.target.value);
    };

    const handleChangeDealer = e => e.target.checked ? setDealer(index) : setDealer(0);

    return (
        <div className={classes.player}>
            {
                editing
                ? <React.Fragment>
                    <TextField value={player.get('name')} onChange={handleChange('name')}/>
                    <IconButton onClick={() => setEditing(false)}>
                        <icons.Check/>
                    </IconButton>
                    <IconButton onClick={() => handleRemovePlayer(index)}>
                        <icons.Delete/>
                    </IconButton>
                </React.Fragment>
                : <React.Fragment>
                    <Typography>
                        { player.get('name') }
                    </Typography>
                    <FormControlLabel
                        label="Dealer"
                        control={<Checkbox checked={dealer === index}/>}
                        onChange={handleChangeDealer}
                    />
                    <IconButton onClick={() => setEditing(true)}>
                        <icons.Pencil/>
                    </IconButton>
                </React.Fragment>
            }
        </div>
    );
};

const enhance = compose(
    withStyles(styles),
    connect(
        state => ({
            dealer: gameSelectors.getDealer(state)
        }),
        dispatch => ({
            setDealer(index) {
                dispatch(gameActions.setDealer(index));
            }
        })
    )
);

export default enhance(Item);
