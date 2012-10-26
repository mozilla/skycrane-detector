(function() {
  try {
    var ids = MozillaVaultDetector();
    document.querySelector(ids.login).style.backgroundColor = "red";
    document.querySelector(ids.login).className += " mozVaultDetectedLoginField";
    document.querySelector(ids.password).style.backgroundColor = "green";
    document.querySelector(ids.password).className += " mozVaultDetectedPasswordField";
    document.querySelector(ids.submit).style.backgroundColor = "yellow";
    document.querySelector(ids.submit).className += " mozVaultDetectedSubmitButton";
  } catch(e) {
    return false;
  }
  return true;
})();
