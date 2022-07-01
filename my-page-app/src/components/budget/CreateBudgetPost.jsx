import React, { useState } from "react";
import "./Budget.scss";
import ApiService from "../../services/api.service";

const CreateBudgetPost = (props) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const budgetPost = {
            "date": date,
            "description": description,
            "amount": amount,
            "expense": true
        }
        ApiService.createBudgetPost(budgetPost,props.budget.id)
    }

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value)
    }

    const handleAmountChange = (e) => {
        setAmount(e.target.value)
    }

    const handleDateChange = (e) => {
        setDate(e.target.value)
    }

   
    return(
        <form onSubmit={handleSubmit}>
            <div>
                <input
                    type="text"
                    name="description"
                    placeholder="Beskrivelse"
                    onChange={handleDescriptionChange}
                    value= {description}
                    />
                    <input
                    type="number"
                    name="amount"
                    placeholder="Pris"
                    onChange={handleAmountChange}
                    value= {amount}
                    />
                    <input
                    type="text"
                    name="date"
                    placeholder="'yyyy-mm-dd'"
                    onChange={handleDateChange}
                    value= {date}
                    />
                    <button type="submit">Legg til utlegget</button>
            </div>
        </form>
    )
}

export default CreateBudgetPost;