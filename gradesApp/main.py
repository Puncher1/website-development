import time

import json
import subprocess
import os
import datetime
import re
from typing import Tuple, Dict, Literal, List
from dotenv import load_dotenv

import selenium.common
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


load_dotenv()

def round_grade(grade: str):
    try:
        grade = float(grade)
    except ValueError:
        rounded_grade = grade
    else:
        grade_digit = grade - int(grade)

        if grade_digit == 0.25:
            rounded_grade = int(grade) + 0.5
        else:
            rounded_grade = round(grade * 2) / 2

    return rounded_grade


class Subject:

    def __init__(self, name: str, abbr: str, type_: str, grade_avg_raw: str, exams: Dict[str, Dict[str, str]]):
        """
        :param name:
        :param abbr:
        :param type_:
        :param grade_avg_raw:
        :param exams: : Dict[name: Dict[date/grade/weight/class_avg: str]]
        """

        self.name = name
        self.abbr = abbr
        self.type_ = type_
        self.exams = exams
        self.grade_avg_raw = grade_avg_raw
        self.grade_avg_round = round_grade(self.grade_avg_raw)


def get_subject_type(subject_name: str, subject_abbr: str) -> str:

    subject_type = "bm"
    if subject_name in ["Bereichsübergreifende Projekte", "Elektrotechnik", "Hard- und Softwaretechnik", "Werkstoff- und Zeichnungstechnik", "Sport"]:
        if "spbm" in subject_abbr.lower():
            subject_type = "bm"
        else:
            subject_type = "job"


    return subject_type


def init_driver():
    options = webdriver.ChromeOptions()
    options.headless = True

    driver = webdriver.Chrome(service= Service("C:/Users/andri/AppData/Local/ChromeDriver/chromedriver.exe"), options=options)

    return driver

def edu_mobile(driver: webdriver.Chrome):
    driver.get(os.getenv("EDU_MOBILE_URL"))

    pin_entry = driver.find_element(by=By.XPATH, value='//*[@id="inputPin"]')
    pin_entry.send_keys(os.getenv("EDU_PIN"))

    pin_ok_btn = driver.find_element(by=By.XPATH, value='/html/body/div/form/input[2]')
    pin_ok_btn.click()

    mobile_body = driver.find_element(by=By.XPATH, value='/html/body')
    print(mobile_body.text)
    up_to_date = False

    if "Sie haben alle Noten bestätigt." in mobile_body.text:  # TODO: remove 'not'
        up_to_date = True

    return up_to_date


def edu_main(driver):
    driver.get(os.getenv("EDU_URL"))

    code_needed = True
    try:
        otp_button = driver.find_element(by=By.XPATH, value='//*[@id="form-container"]/div[5]/div/a/span')
    except selenium.common.NoSuchElementException:
        code_needed = False

    username_entry = driver.find_element(by=By.XPATH, value='//*[@id="form-holder"]/div/form/div[1]/input')
    username_entry.send_keys(os.getenv("EDU_USERNAME"))

    password_entry = driver.find_element(by=By.XPATH, value='//*[@id="form-holder"]/div/form/div[2]/input')
    password_entry.send_keys(os.getenv("EDU_PASSWORD"))

    button = driver.find_element(by=By.XPATH, value='//*[@id="form-actions"]/div/button')
    button.click()

    if code_needed:
        code_input = input("Please enter SMS code: ")
        print(f"{code_input=}")

        code_entry = driver.find_element(by=By.XPATH, value='//*[@id="form-holder"]/div/form/div[1]/input')      # TODO: entry for SMS code
        code_entry.send_keys(code_input)

        sms_button = driver.find_element(by=By.XPATH, value='//*[@id="form-actions"]/div/button')               # TODO: button for SMS code
        sms_button.click()

    grades_button = driver.find_element(by=By.XPATH, value='//*[@id="menu21311"]')
    print(grades_button.text)
    grades_button.click()


def build_objects(subject_texts, detail_texts) -> List[Subject]:
    subj_objects = []
    for subject_text, subject_details in zip(subject_texts, detail_texts):
        subject_name_abbr = subject_text[0].split("\n")
        subject_abbr = subject_name_abbr[0]
        subject_name = subject_name_abbr[1]
        subject_avg_grade = subject_text[1]
        subject_type = get_subject_type(subject_name, subject_abbr)

        dict_exams = {}
        for exam in subject_details:
            exam_date = exam[0]
            exam_name = exam[1]
            exam_grade = exam[2]
            exam_weight = exam[3]
            exam_class_avg = exam[4]

            dict_exams[exam_name] = {'date': exam_date, 'grade': exam_grade, 'weight': exam_weight, 'class_avg': exam_class_avg}

        subj_obj = Subject(subject_name, subject_abbr, subject_type, subject_avg_grade, dict_exams)
        subj_objects.append(subj_obj)

    return subj_objects


def manage_data(subject_rows, detail_list_rows) -> Tuple[list, list]:
    detail_texts = []
    for detail_rows in detail_list_rows:

        detail_row_texts = []
        for detail_row in detail_rows:
            detail_row_elements = detail_row.find_elements(By.TAG_NAME, "td")

            detail_row_element_texts = []
            skip_elements = False
            for detail_row_element in detail_row_elements:
                detail_row_element_text = detail_row_element.text

                if detail_row_element_text in ["Aktueller Durchschnitt:", "Datum"]:
                    skip_elements = True
                    break

                detail_row_element_texts.append(detail_row_element_text)

            if skip_elements:
                skip_elements = False
                continue

            detail_row_texts.append(detail_row_element_texts)

        detail_texts.append(detail_row_texts)

    subject_texts = []
    for subject_row in subject_rows:
        subject_row_elements = subject_row.find_elements(By.TAG_NAME, "td")

        subject_row_element_texts = []
        for subject_row_element in subject_row_elements:
            subject_row_element_text = subject_row_element.text
            subject_row_element_texts.append(subject_row_element_text)

        subject_texts.append(subject_row_element_texts)

    return subject_texts, detail_texts

def scrape_data(driver) -> Tuple[list, list]:
    grades_table = driver.find_element(by=By.XPATH, value='//*[@id="uebersicht_bloecke"]/page/div/table')
    subject_rows = grades_table.find_elements(By.TAG_NAME, "tr")

    subj_row_count = 0
    for subject_row in subject_rows:
        subj_row_text = subject_row.text
        if subj_row_text == "" or subj_row_text == "Kurs Notendurchschnitt Bestätigt":
            continue

        subj_row_count += 1

    i = 0
    while i <= subj_row_count:
        try:
            button_detail = driver.find_element(by=By.XPATH, value=f'//*[@id="einzelpr_btn_0_{i}"]')
        except selenium.common.NoSuchElementException:
            pass
        else:
            button_detail.click()

        i += 1

    subject_rows = []
    subj_row_count_ = subj_row_count
    i = 0
    while i < subj_row_count_:
        try:
            subject_element_test = driver.find_element(by=By.XPATH,
                                                       value=f'//*[@id="uebersicht_bloecke"]/page/div/table/tbody/tr[{i}]/td[4]')
        except selenium.common.NoSuchElementException:
            subj_row_count_ += 1
        else:
            try:
                subject_row = driver.find_element(by=By.XPATH,
                                                  value=f'//*[@id="uebersicht_bloecke"]/page/div/table/tbody/tr[{i}]')
            except selenium.common.NoSuchElementException:
                subject_rows.append("")
            else:
                subject_rows.append(subject_row)

        i += 1

    detail_rows = []
    i = 3
    while i <= (subj_row_count * 3):
        try:
            detail_table = driver.find_element(by=By.XPATH,
                                               value=f'//*[@id="uebersicht_bloecke"]/page/div/table/tbody/tr[{i}]/td/table')
            detail_table_rows = detail_table.find_elements(By.TAG_NAME, "tr")

        except selenium.common.NoSuchElementException:
            detail_rows.append("")
        else:
            detail_rows.append(detail_table_rows)

        i += 3

    return subject_rows, detail_rows

def calc_type_avg(subj_objects: List[Subject]) -> Tuple[Tuple[int, int], Tuple[int, int]]:

    bm_avg = 0
    bm_avg_round = 0
    job_avg = 0
    job_avg_round = 0

    bm_count = 0
    job_count = 0
    for subj_obj in subj_objects:
        try:
            subj_grade_raw = float(subj_obj.grade_avg_raw)
            subj_grade_rounded = float(subj_obj.grade_avg_round)
        except ValueError:
            continue

        if subj_obj.type_ == "bm":
            bm_avg += subj_grade_raw
            bm_avg_round += subj_grade_rounded
            bm_count += 1
        else:
            job_avg += subj_grade_raw
            job_avg_round += subj_grade_rounded
            job_count += 1

    bm_avg /= bm_count
    bm_avg = round(bm_avg, 2)
    bm_avg_round /= bm_count
    bm_avg_round = round(bm_avg_round, 1)

    job_avg /= job_count
    job_avg = round(job_avg, 2)
    job_avg_round /= job_count
    job_avg_round = round(job_avg_round, 1)

    bm_avgs = (bm_avg, bm_avg_round)
    job_avgs = (job_avg, job_avg_round)

    return bm_avgs, job_avgs


def sync():
    edu_main(driver)
    subject_rows, detail_rows = scrape_data(driver)
    subject_texts, detail_texts = manage_data(subject_rows, detail_rows)
    subj_objects = build_objects(subject_texts, detail_texts)

    bm_avgs, job_avgs = calc_type_avg(subj_objects)
    bm_avg, bm_avg_round = bm_avgs
    job_avg, job_avg_round = job_avgs

    json_dict = {
        "bmAvg": [str(bm_avg), str(bm_avg_round)],
        "jobAvg": [str(job_avg), str(job_avg_round)],
        "subjects": {}
    }
    for subj_obj in subj_objects:
        json_dict["subjects"][subj_obj.abbr] = {
            "name": subj_obj.name,
            "type": subj_obj.type_,
            "gradeAvgRaw": str(subj_obj.grade_avg_raw),
            "gradeAvgRound": str(subj_obj.grade_avg_round),
            "exams": subj_obj.exams,
        }

    with open("./json/data.json") as fdata:
        data = json.load(fdata)
        data = json_dict
        with open("./json/data.json") as fdata:
            json.dump(data, fdata, sort_keys=True, indent=4)

    return json_dict


import os

import redis
from flask import Flask, redirect, url_for, render_template, request, session
from flask_session import Session

from database import Login


template_folder = os.path.abspath("./html")

app = Flask(__name__, template_folder=template_folder)
app.secret_key = os.getenv("APP_SECRET_KEY")
app.config["TEMPLATES_AUTO_RELOAD"] = True

app.config["SESSION_TYPE"] = "redis"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_REDIS"] = redis.from_url("redis://localhost:6379")

server_session = Session(app)

driver = init_driver()

@app.route("/", methods=["GET", "POST"])
def home():
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if "is_redirect" in session:
        return redirect(url_for("grades"))

    if request.method == "POST":
        request_json = request.json["request"]
        request_type = request_json["type"]

        if request_type == "set":
            request_data = request_json["data"]
            user = request_data["username"]
            pw = request_data["password"]

            query = Login.select().where(Login.user == user)

            valid_login = True
            if not query.exists():
                valid_login = False

            else:
                result = query.get()
                grades_pw = result.pw

                if not grades_pw == pw:
                    valid_login = False

            if valid_login:
                session["is_redirect"] = True
                return {"status": "ok"}
            else:
                return {"status": "invalid"}

        else:
            return None         # throws Internal Server error

    else:
        return render_template("login.html")


@app.route("/grades", methods=["GET", "POST"])
def grades():
    if request.method == "POST":
        request_json = request.json["request"]
        request_type = request_json["type"]
        request_data = request_json["data"]

        if request_type == "get":
            if request_data == "update_needed":
                up_to_date = edu_mobile(driver)

                if up_to_date:
                    print("not update_needed")
                    return {"status": "false"}
                else:
                    print("update_needed")
                    return {"status": "true"}

            elif request_data == "grades":
                time.sleep(3)

                data = {
                    "bmAvg": ["4.79", "4.8"],
                    "jobAvg": ["5.05", "5.0"],
                    "subjects": {
                        "BEPR-ELO2-HEPH": {
                            "name": "Bereichsübergreifende Projekte",
                            "type": "job",
                            "gradeAvgRaw": "4.767",
                            "gradeAvgRound": "5",
                            "exams": {},

                        },
                        "CH-BMP2-BRUT": {
                            "name": "Chemie",
                            "type": "bm",
                            "gradeAvgRaw": "3.545",
                            "gradeAvgRound": "3.5",
                            "exams": {},

                        }
                    }
                }

                code_needed = False
                if code_needed:
                    return {"status": "true"}
                else:
                    return {"status": "false", "data": data}

        elif request_type == "set":
            if request_data[0] == "code":
                code = request_data[1]
                print(code)
                time.sleep(3)
                data = {
                    "bmAvg": ["4.79", "4.8"],
                    "jobAvg": ["5.05", "5.0"],
                    "subjects": {
                        "BEPR-ELO2-HEPH": {
                            "name": "Bereichsübergreifende Projekte",
                            "type": "job",
                            "gradeAvgRaw": "4.767",
                            "gradeAvgRound": "5",
                            "exams": {},

                        },
                        "CH-BMP2-BRUT": {
                            "name": "Chemie",
                            "type": "bm",
                            "gradeAvgRaw": "3.545",
                            "gradeAvgRound": "3.5",
                            "exams": {},

                        }
                    }
                }

                return {"data": data}

    else:
        if "is_redirect" in session:
            return render_template("grades.html")
        else:
            return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(host="0.0.0.0")
