const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS for all domains
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static HTML files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Route to handle crawling
app.post('/crawl', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).send({ message: 'Please provide a valid URL.' });
    }

    try {
        // Fetch the HTML content
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        // Extract content from the body
        const bodyContent = $('body').html();

        // Save content to a .txt file
        const outputFilePath = path.join(__dirname, 'output.txt');
        fs.writeFile(outputFilePath, bodyContent, (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return res.status(500).send({ message: 'Failed to save content.' });
            }
            console.log('Content saved to output.txt');

            // Send the file back to the user
            res.download(outputFilePath, 'output.txt', (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    return res.status(500).send({ message: 'Failed to download the file.' });
                }
            });
        });
    } catch (error) {
        console.error(`Error fetching the URL: ${error.message}`);
        res.status(500).send({ message: 'Failed to fetch content.' });
    }
});

// Route to handle crawling
app.post('/crawl-google-sheet-integrated', async (req, res) => {
    const { url, checkedUrl } = req.body;

    if (!url) {
        return res.status(400).send({ message: 'Please provide a valid URL.' });
    }

    try {
        // Fetch the HTML content
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        // Extract content from the body
        const bodyContent = $('body').html();

        // Check for <a> and <img> tags with href or src matching checkedUrl
        const matchingLinks = [];
        
        // Check <a> tags
        $('a').each((index, element) => {
            const href = $(element).attr('href');
            if (href && href === checkedUrl) {
                matchingLinks.push($(element).prop('outerHTML'));
            }
        });

        // Check <img> tags
        $('img').each((index, element) => {
            const src = $(element).attr('src');
            if (src && src === checkedUrl) {
                matchingLinks.push($(element).prop('outerHTML'));
            }
        });

        // Save content to a .txt file
        const outputFilePath = path.join(__dirname, 'output.txt');
        fs.writeFile(outputFilePath, bodyContent, (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return res.status(500).send({ message: 'Failed to save content.' });
            }
            console.log('Content saved to output.txt');

            // Determine response
            if (matchingLinks.length > 0) {
                return res.send({ message: 'Links found!', links: matchingLinks });
            } else {
                return res.send({ message: 'No matching links found. Crawled URL:', crawledUrl: url });
            }
        });
    } catch (error) {
        console.error(`Error fetching the URL: ${error.message}`);
        res.status(500).send({ message: 'Failed to fetch content.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
