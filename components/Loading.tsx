import React from 'react'
import CircularProgress from '@mui/material/CircularProgress';
import styled from 'styled-components';


const Loading = () => {
    const StyledContainer = styled.div`
        height: 100vh;
        display: flex;
        justify-content:center;
        align-items: center;
        flex-direction: column;
    `

    return (
        <StyledContainer>
            <h1>Loading ... </h1>
            <CircularProgress />
        </StyledContainer>
    )
}

export default Loading