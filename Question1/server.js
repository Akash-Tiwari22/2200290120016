
const express = require('express');
const axios = require('axios');

const app = express();
const port = 9876;

// Window size
const windowSize = 10;

// Store numbers in a window
let storedNumbers = [];

// Function to fetch numbers from the third-party APIs
async function fetchNumbers(type) {
    let url;

    switch (type) {
        case 'p': // Prime Numbers
            url = 'http://20.244.56.144/evaluation-service/primes';
            break;
        case 'f': // Fibonacci Numbers
            url = 'http://20.244.56.144/evaluation-service/fibo';
            break;
        case 'e': // Even Numbers
            url = 'http://20.244.56.144/evaluation-service/even';
            break;
        case 'r': // Random Numbers
            url = 'http://20.244.56.144/evaluation-service/rand';
            break;
        default:
            throw new Error('Invalid type');
    }

    try {
        const response = await axios.get(url, { timeout: 500 });
        return response.data.numbers || [];
    } catch (error) {
        console.error('Error fetching numbers:', error);
        return [];
    }
}

// Function to calculate average
function calculateAverage(numbers) {
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return (sum / numbers.length).toFixed(2);
}

// Define the main route for handling number requests
app.get('/numbers/:numberid', async (req, res) => {
    const numberType = req.params.numberid;

    if (!['p', 'f', 'e', 'r'].includes(numberType)) {
        return res.status(400).send('Invalid number ID');
    }

    // Fetch numbers from the 3rd party server
    const newNumbers = await fetchNumbers(numberType);

    // If new numbers are fetched, filter duplicates and store them
    if (newNumbers.length > 0) {
        newNumbers.forEach(num => {
            if (!storedNumbers.includes(num)) {
                storedNumbers.push(num);
            }
        });
    }

    // Limit the stored numbers to the window size (10)
    if (storedNumbers.length > windowSize) {
        storedNumbers = storedNumbers.slice(storedNumbers.length - windowSize);
    }

    // Calculate the average
    const avg = calculateAverage(storedNumbers);

    // Prepare response
    const response = {
        windowPrevState: storedNumbers.slice(0, -newNumbers.length), // Numbers before the latest API call
        windowCurrState: storedNumbers, // Numbers after the latest API call
        numbers: newNumbers, // Response received from the server
        avg: parseFloat(avg) // Average of the stored numbers
    };

    // Respond to the client
    res.json(response);
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
