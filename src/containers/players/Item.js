import React, { useState } from 'react';
import { createStyles, TextField, Typography, withStyles, IconButton } from '@material-ui/core';
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
    const { classes, player, handlePlayerChange, handleRemovePlayer, index } = props;
    const [editing, setEditing] = useState(false);

    const handleChange = name => e => {
        handlePlayerChange(index, name, e.target.value);
    };

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
                    <IconButton onClick={() => setEditing(true)}>
                        <icons.Pencil/>
                    </IconButton>
                </React.Fragment>
            }
        </div>
    );
};

export default withStyles(styles)(Item);
