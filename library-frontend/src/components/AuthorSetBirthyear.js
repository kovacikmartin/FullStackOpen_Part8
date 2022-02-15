import React, { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { ALL_AUTHORS, SET_BIRTHYEAR } from '../queries'

const AuthorSetBirthyear = ({show}) => {

    const [name, setName] = useState('')
    const [born, setBorn] = useState('')

    const authorsResult = useQuery(ALL_AUTHORS)

    const [setBirthyear] = useMutation(SET_BIRTHYEAR, {
        refetchQueries: [{query: ALL_AUTHORS}]
    })

    const submit = async (event) => {

        event.preventDefault()

        setBirthyear({variables: {name, born: parseInt(born)}})

        setName('')
        setBorn('')
    }

    if(authorsResult.loading || !show){

        return null
    }

    const authors = authorsResult.data.allAuthors

    return (
        <div>
            <h2>set birthyear</h2>
            <form onSubmit={submit}>
                <div>
                    author
                    <select onChange={({target}) => setName(target.value)}>
                        {authors.map(author => 

                            <option key={author.name} value={author.name}>{author.name}</option>
                        )}
                    </select>
                </div>
                <div>
                    born
                    <input
                        value={born}
                        onChange={({ target }) => setBorn(target.value)}
                    />
                </div>
                <button type='submit'>update author</button>
            </form>
        </div>
      )
}

export default AuthorSetBirthyear