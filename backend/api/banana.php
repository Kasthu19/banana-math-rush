<?php
// backend/api/banana.php

header('Content-Type: application/json');

// Fetching from the provided Banana API proxy URL
$external_url = "https://marcconrad.com/uob/banana/api.php";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $external_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$response = curl_exec($ch);
curl_close($ch);

if ($response) {
    echo $response;
} else {
    echo json_encode(["error" => "Failed to fetch data from Banana API"]);
}
?>